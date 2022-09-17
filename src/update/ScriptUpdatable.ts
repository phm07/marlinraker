import { Updatable } from "./Updatable";
import { logger, marlinRaker } from "../Server";
import { exec } from "child_process";

type TInfo = { version?: unknown, remote_version?: unknown };

class ScriptUpdatable extends Updatable<TInfo> {

    public readonly scriptFile: string;

    public constructor(name: string, scriptFile: string) {
        super(name);
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
                        reject(`${(e as Error).message}\nin ${stdout}`);
                    }
                });
            });
            await marlinRaker.updateManager.emit();
        } catch (e) {
            logger.error(`Error while checking for update for ${this.name}`);
            logger.error(e);
        }
    }

    public isUpdatePossible(): boolean {
        return Boolean(this.info
            && this.info.remote_version
            && this.info.remote_version !== "?"
            && this.info.remote_version !== this.info.version);
    }

    public async update(): Promise<void> {
        if (!this.isUpdatePossible()) throw "No update to download";
        const log = this.createLogger();
        await this.doUpdate(log, this.scriptFile, ["-u"]);
        await this.checkForUpdate();
        await marlinRaker.updateManager.emit();
    }
}

export default ScriptUpdatable;