import crypto from "crypto";
import { logger, marlinRaker } from "../Server";
import { spawn } from "child_process";
import readline from "readline";

type TLogger = (message: string, error?: boolean, complete?: boolean) => Promise<void>;

abstract class Updatable<TInfo> {

    public readonly name: string;
    public info?: TInfo;

    protected constructor(name: string) {
        this.name = name;
    }

    public abstract checkForUpdate(): Promise<void>;
    public abstract isUpdatePossible(): boolean;
    public abstract update(): Promise<void>;

    protected createLogger(): TLogger {
        const procId = crypto.randomBytes(2).readUInt16LE();
        return async (message: string, error = false, complete = false): Promise<void> => {
            if (!complete && !message.trim()) return;
            logger[error ? "error" : "info"](`Updating ${this.name}: ${message}`);
            await marlinRaker.updateManager.notifyUpdateResponse(this.name, procId, message, complete);
        };
    }

    protected async doUpdate(log: TLogger, command: string, args: string[]): Promise<void> {

        const process = spawn(command, args, { shell: true });
        const outLineReader = readline.createInterface(process.stdout);
        outLineReader.on("line", async (line) => {
            await log(line);
        });
        const errLineReader = readline.createInterface(process.stderr);
        errLineReader.on("line", async (line) => {
            await log(line, true);
        });

        await new Promise<void>((resolve) => outLineReader.on("close", resolve));
        await log("Update complete", false, true);
    }
}

export { Updatable };