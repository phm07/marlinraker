import { config, logger, marlinRaker, rootDir } from "../Server";
import HttpsRequest from "./HttpsRequest";
import path from "path";
import GithubReleaseUpdatable from "./GithubReleaseUpdatable";
import { IUpdatable } from "./IUpdatable";
import NamedObjectMap from "../util/NamedObjectMap";
import SystemUpdatable from "./SystemUpdatable";
import SimpleNotification from "../api/notifications/SimpleNotification";

type TUpdateStatus = {
    busy: boolean;
    github_rate_limit: number;
    github_requests_remaining: number;
    github_limit_reset_time: number;
    version_info: Record<string, unknown>
};

type TRateLimit = {
    limit: number,
    remaining: number,
    reset: number
};

class UpdateManager {

    private readonly updatables: NamedObjectMap<IUpdatable<unknown>>;
    private readonly scheduledUpdates: [() => Promise<void>, () => void][];
    public busy: boolean;

    public constructor() {
        this.busy = false;
        this.scheduledUpdates = [];
        this.updatables = new NamedObjectMap<IUpdatable<unknown>>(<IUpdatable<unknown>[]>[
            process.env.NODE_ENV === "production" && new GithubReleaseUpdatable("marlinraker", path.resolve("./"), config.getOrDefault("update_manager.marlinraker_repo", "pauhull/marlinraker")),
            new GithubReleaseUpdatable("client", path.join(rootDir, "www"), config.getOrDefault("update_manager.client_repo", "mainsail-crew/mainsail")),
            new SystemUpdatable()
        ]);

        this.checkForUpdates();
    }

    public async update(name: string): Promise<void> {
        if (this.busy) throw "Already updating";
        if (marlinRaker.jobManager.isPrinting()) throw "Cannot update while printing";
        const updatable = this.updatables[name];
        if (!updatable) throw `Unknown client "${name}"`;
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

    public checkForUpdates(): void {
        for (const name in this.updatables) {
            this.updatables[name]!.checkForUpdate();
        }
    }

    public async getUpdateStatus(): Promise<TUpdateStatus> {
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

    private static async getRateLimit(): Promise<TRateLimit> {
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

export { TUpdateStatus };
export default UpdateManager;