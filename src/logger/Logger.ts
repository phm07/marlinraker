/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { styleText } from "util";
import { createStream, RotatingFileStream } from "rotating-file-stream";

enum Level {
    error,
    warn,
    info,
    http,
    debug
}

type TConsoleColor = "white" | "red" | "yellow";

class Logger {

    public readonly logFile: string;
    public readonly isConsole: boolean;
    public readonly isLog: boolean;
    public level: Level;
    private readonly outStream?: RotatingFileStream;

    public constructor(logFile: string, isConsole: boolean, isLog: boolean) {
        this.logFile = logFile;
        this.isConsole = isConsole;
        this.isLog = isLog;
        this.level = Level.info;

        if (isLog) {
            fs.mkdirSync(path.dirname(logFile), { recursive: true });
            this.outStream = createStream(path.basename(logFile), {
                path: path.dirname(logFile),
                size: "1M",
                compress: "gzip",
                rotate: 5
            });
        }
    }

    public async shutdownGracefully(): Promise<void> {
        if (!this.outStream) return;
        const outStream = this.outStream;
        return new Promise<void>((resolve) => {
            outStream.end("\n", resolve);
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
            let color: TConsoleColor = "white", func = console.log;
            switch (level) {
            case Level.error:
                color = "red";
                func = console.error;
                break;
            case Level.warn:
                color = "yellow";
                break;
            }
            func(styleText(color, formatted));
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