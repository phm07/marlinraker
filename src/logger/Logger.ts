/* eslint-disable no-console */
import chalk from "chalk";
import logrotateStream from "logrotate-stream";
import fs, { WriteStream } from "fs-extra";
import path from "path";
import { Writable } from "stream";

enum Level {
    error,
    warn,
    info,
    http,
    debug
}

type TOutStream = Writable & {
    writer?: WriteStream;
};

class Logger {

    public readonly logFile: string;
    public readonly isConsole: boolean;
    public readonly isLog: boolean;
    public level: Level;
    private readonly outStream?: TOutStream;

    public constructor(logFile: string, isConsole: boolean, isLog: boolean) {
        this.logFile = logFile;
        this.isConsole = isConsole;
        this.isLog = isLog;
        this.level = Level.info;

        if (isLog) {
            fs.mkdirsSync(path.dirname(logFile)); // has to be sync because of constructor
            this.outStream = logrotateStream({
                file: logFile,
                size: "1M",
                compress: true,
                keep: 5
            }) as TOutStream;
        }
    }

    public async shutdownGracefully(): Promise<void> {
        if (!this.outStream) return;
        this.outStream.end("\n");
        return new Promise<void>((resolve) => {
            (this.outStream!.writer ?? this.outStream!).on("finish", resolve);
        });
    }

    private log(level: Level, message: unknown): void {

        if (level > this.level) return;

        const time = new Date();
        const timeFormatted = `${time.getHours().toString().padStart(2, "0")}:${
            time.getMinutes().toString().padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`;
        const messageFormatted = message instanceof Error ? message.stack ?? message.message : message;
        const formatted = `${`[${Level[level].toUpperCase()}]`.padEnd(7)} ${timeFormatted} ${messageFormatted}`;

        if (this.outStream?.writable) {
            this.outStream.write(`${formatted}\n`);
        }

        if (this.isConsole) {
            let color = chalk.white, func = console.log;
            switch (level) {
            case Level.error:
                color = chalk.red;
                func = console.error;
                break;
            case Level.warn:
                color = chalk.yellow;
                break;
            }
            func(color(formatted));
        }
    }

    public error(message: unknown): void {
        this.log(Level.error, message);
    }

    public warn(message: unknown): void {
        this.log(Level.warn, message);
    }

    public info(message: unknown): void {
        this.log(Level.info, message);
    }

    public http(message: unknown): void {
        this.log(Level.http, message);
    }

    public debug(message: unknown): void {
        this.log(Level.debug, message);
    }
}

export { Level };
export default Logger;