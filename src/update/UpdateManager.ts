import { logger, rootDir } from "../Server";
import path from "path";
import NamedObjectMap from "../util/NamedObjectMap";
import SystemUpdatable from "./SystemUpdatable";
import SimpleNotification from "../api/notifications/SimpleNotification";
import fs from "fs";
import ScriptUpdatable from "./ScriptUpdatable";
import { Updatable } from "./Updatable";
import MarlinRaker from "../MarlinRaker";
import Utils from "../util/Utils";

interface IUpdateStatus {
    busy: boolean;
    github_rate_limit: number;
    github_requests_remaining: number;
    github_limit_reset_time: number;
    version_info: Record<string, unknown>;
}

interface IRateLimit {
    limit: number;
    remaining: number;
    reset: number;
}

class UpdateManager {

    private static readonly GITHUB_RATE_LIMIT_URL = "https://api.github.com/rate_limit";
    private static readonly GITHUB_TIMEOUT_MS = 5000;

    public readonly updatables: NamedObjectMap<Updatable<unknown>>;
    public busy: boolean;
    private readonly marlinRaker: MarlinRaker;
    private readonly scheduledUpdates: [() => Promise<void>, () => void][];

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
        this.busy = false;
        this.scheduledUpdates = [];
        this.updatables = new NamedObjectMap<Updatable<unknown>>();

        if (SystemUpdatable.isSupported()) {
            this.updatables.add(new SystemUpdatable(marlinRaker));
        }

        this.loadScripts();
        void this.checkForUpdates();
    }

    private loadScripts(): void {
        const scriptsDir = path.join(rootDir, "update_scripts");
        fs.mkdirSync(scriptsDir, { recursive: true });
        for (const file of fs.readdirSync(scriptsDir, { withFileTypes: true })) {
            if (!file.isFile() || file.name.startsWith("_")) continue;
            const updatable = new ScriptUpdatable(this.marlinRaker, file.name.split(".")[0], path.join(scriptsDir, file.name));
            this.updatables.set(updatable.name, updatable);
        }
    }

    public async fullUpdate(): Promise<void> {
        if (this.updatables.get("system")?.isUpdatePossible()) {
            await this.update("system");
        }
        await Promise.all(Array.from(this.updatables.values())
            .filter((updatable) => updatable!.name !== "marlinraker" && updatable!.isUpdatePossible())
            .map(async (updatable) => {
                await this.update(updatable!.name);
            }));
        if (this.updatables.get("marlinraker")?.isUpdatePossible()) {
            await this.update("marlinraker");
        }
    }

    public async update(name: string): Promise<void> {
        if (this.busy) throw new Error("Already updating");
        if (this.marlinRaker.jobManager.isPrinting()) throw new Error("Cannot update while printing");
        const updatable = this.updatables.get(name);
        if (!updatable) throw new Error(`Unknown client "${name}"`);
        if (!updatable.isUpdatePossible()) throw new Error(`Cannot update ${name}`);
        return new Promise<void>((resolve) => {
            void this.scheduleUpdate(updatable.update.bind(updatable), resolve);
        });
    }

    private async doUpdate(): Promise<void> {
        if (this.busy || !this.scheduledUpdates.length) return;
        this.busy = true;
        while (this.scheduledUpdates.length) {
            const [update, callback] = this.scheduledUpdates.shift()!;
            await update();
            this.busy = Boolean(this.scheduledUpdates.length);
            await this.emit();
            callback();
        }
    }

    private async scheduleUpdate(update: () => Promise<void>, callback: () => void): Promise<void> {
        this.scheduledUpdates.push([update, callback]);
        await this.doUpdate();
    }

    public async emit(): Promise<void> {
        await this.marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_update_refreshed", [
            await this.getUpdateStatus()
        ]));
    }

    public async checkForUpdates(): Promise<void> {
        await Promise.all(Array.from(this.updatables.values())
            .map(async (updatable) => await updatable.checkForUpdate()));
    }

    public async getUpdateStatus(): Promise<IUpdateStatus> {
        const rateLimit = await UpdateManager.getRateLimit();
        const versionInfo: Record<string, unknown> = {};
        for (const [name, updatable] of this.updatables) {
            if (updatable.info) {
                versionInfo[name] = updatable.info;
            }
        }
        return {
            busy: this.busy,
            github_rate_limit: rateLimit.limit,
            github_requests_remaining: rateLimit.remaining,
            github_limit_reset_time: rateLimit.reset,
            version_info: versionInfo
        };
    }

    public async notifyUpdateResponse(application: string, procId: number, message: string, complete: boolean): Promise<void> {
        return this.marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_update_response", [{
            application,
            proc_id: procId,
            message,
            complete
        }]));
    }

    private static async getRateLimit(): Promise<IRateLimit> {
        try {
            const response = await fetch(UpdateManager.GITHUB_RATE_LIMIT_URL, {
                headers: { "User-Agent": "marlinraker" },
                signal: AbortSignal.timeout(UpdateManager.GITHUB_TIMEOUT_MS)
            });
            const { rate } = await response.json() as { rate?: Partial<IRateLimit> };

            if (typeof rate?.limit === "number"
                && typeof rate.remaining === "number"
                && typeof rate.reset === "number") {

                return {
                    limit: rate.limit,
                    remaining: rate.remaining,
                    reset: rate.reset
                };
            }
        } catch (e) {
            logger.warn(`Could not fetch GitHub rate limit: ${Utils.errorToString(e)}`);
        }

        return {
            limit: 0,
            remaining: 0,
            reset: 0
        };
    }
}

export { IUpdateStatus };
export default UpdateManager;