import { Updatable } from "./Updatable";
import { logger } from "../Server";
import { exec } from "child_process";
import Utils from "../util/Utils";
import MarlinRaker from "../MarlinRaker";

interface IInfo {
    version?: unknown;
    remote_version?: unknown;
}

class ScriptUpdatable extends Updatable<IInfo> {

    public readonly scriptFile: string;

    public constructor(marlinRaker: MarlinRaker, name: string, scriptFile: string) {
        super(marlinRaker, name);
        this.scriptFile = scriptFile;
    }

    public async checkForUpdate(): Promise<void> {
        try {
            this.info = await new Promise((resolve, reject) => {
                exec(`${this.scriptFile} -i`, (error, stdout, stderr) => {
                    if (error || stderr) {
                        reject(error ?? stderr);
                        return;
                    }
                    try {
                        resolve(JSON.parse(stdout));
                    } catch (e) {
                        reject(`${Utils.errorToString(e)}\nin ${stdout}`);
                    }
                });
            });
            await MarlinRaker.getInstance().updateManager.emit();
        } catch (e) {
            logger.error(`Error while checking for update for ${this.name}:`);
            logger.error(e);
        }
    }

    public isUpdatePossible(): boolean {
        return Boolean(this.info?.remote_version
            && this.info.remote_version !== "?"
            && this.info.remote_version !== this.info.version);
    }

    public async update(): Promise<void> {
        if (!this.isUpdatePossible()) throw new Error("No update to download");
        const log = this.createLogger();
        await this.doUpdate(log, this.scriptFile, ["-u"]);
        await this.checkForUpdate();
        await this.marlinRaker.updateManager.emit();
    }
}

export default ScriptUpdatable;