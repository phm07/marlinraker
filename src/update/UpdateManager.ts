import { logger, marlinRaker, rootDir } from "../Server";
import HttpsRequest from "./HttpsRequest";
import path from "path";
import NamedObjectMap from "../util/NamedObjectMap";
import SystemUpdatable from "./SystemUpdatable";
import SimpleNotification from "../api/notifications/SimpleNotification";
import fs from "fs-extra";
import ScriptUpdatable from "./ScriptUpdatable";
import { Updatable } from "./Updatable";

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

    private readonly scheduledUpdates: [() => Promise<void>, () => void][];
    public readonly updatables: NamedObjectMap<Updatable<unknown>>;
    public busy: boolean;

    public constructor() {
        this.busy = false;
        this.scheduledUpdates = [];
        this.updatables = new NamedObjectMap<Updatable<unknown>>();

        if (process.platform === "linux") {
            this.updatables.system = new SystemUpdatable();
        }

        this.loadScripts();
        void this.checkForUpdates();
    }

    private loadScripts(): void {
        const scriptsDir = path.join(rootDir, "update_scripts");
        fs.mkdirsSync(scriptsDir);
        for (const file of fs.readdirSync(scriptsDir, { withFileTypes: true })) {
            if (!file.isFile() || file.name.startsWith("_")) continue;
            const updatable = new ScriptUpdatable(file.name.split(".")[0], path.join(scriptsDir, file.name));
            this.updatables[updatable.name] = updatable;
        }
    }

    public async fullUpdate(): Promise<void> {
        if (this.updatables.system?.isUpdatePossible()) {
            await this.update("system");
        }
        await Promise.all(Object.values(this.updatables)
            .filter((updatable) => updatable!.name !== "marlinraker" && updatable!.isUpdatePossible())
            .map(async (updatable) => {
                await this.update(updatable!.name);
            }));
        if (this.updatables.marlinraker?.isUpdatePossible()) {
            await this.update("marlinraker");
        }
    }

    public async update(name: string): Promise<void> {
        if (this.busy) throw new Error("Already updating");
        if (marlinRaker.jobManager.isPrinting()) throw new Error("Cannot update while printing");
        const updatable = this.updatables[name];
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
        await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_update_refreshed", [
            await this.getUpdateStatus()
        ]));
    }

    public async checkForUpdates(): Promise<void> {
        await Promise.all(Object.values(this.updatables)
            .map(async (updatable) => await updatable!.checkForUpdate()));
    }

    public async getUpdateStatus(): Promise<IUpdateStatus> {
        const rateLimit = await UpdateManager.getRateLimit();
        const versionInfo: Record<string, unknown> = {};
        for (const name in this.updatables) {
            const info = this.updatables[name]?.info;
            if (info) {
                versionInfo[name] = info;
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
        return marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_update_response", [{
            application,
            proc_id: procId,
            message,
            complete
        }]));
    }

    private static async getRateLimit(): Promise<IRateLimit> {
        try {
            const response = await new HttpsRequest("https://api.github.com/rate_limit").getString();
            const data = JSON.parse(response);

            if ("rate" in data && typeof data.rate === "object"
                && "limit" in data.rate && typeof data.rate.limit === "number"
                && "remaining" in data.rate && typeof data.rate.remaining === "number"
                && "reset" in data.rate && typeof data.rate.reset === "number") {

                return {
                    limit: data.rate.limit,
                    remaining: data.rate.remaining,
                    reset: data.rate.reset
                };
            }
        } catch (e) {
            logger.error(e);
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