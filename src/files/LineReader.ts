import { ReadStream } from "fs";
import readline, { Interface } from "readline";

class LineReader {

    private static readonly BUFFER_CAP = 500;

    public position: number;
    private readonly reader: Interface;
    private readonly buffer: string[];
    private paused: boolean;
    private closed: boolean;

    public constructor(stream: ReadStream) {
        this.buffer = [];
        this.position = 0;
        this.paused = false;
        this.closed = false,

        this.reader = readline.createInterface(stream);
        this.reader.prependListener("line", this.handleLine.bind(this));
        this.reader.on("pause", () => this.paused = true);
        this.reader.on("resume", () => this.paused = false);
        this.reader.on("close", () => this.closed = true);
    }

    public close(): void {
        this.reader.close();
    }

    public async readLine(): Promise<string | null> {
        if (this.closed && !this.buffer.length) return null;
        if (this.paused && this.buffer.length < LineReader.BUFFER_CAP) {
            this.reader.resume();
        }
        if (this.buffer.length) {
            const line = this.buffer.shift()!;
            this.position += Buffer.byteLength(line, "utf-8") + 1; // \n
            return line;
        } else {
            return new Promise<string | null>((resolve) => {
                const onLine = (): void => {
                    this.readLine().then(resolve);
                    this.reader.removeListener("close", onClose);
                };
                const onClose = (): void => {
                    resolve(null);
                    this.reader.removeListener("line", onLine);
                };
                this.reader.once("line", onLine);
                this.reader.once("close", onClose);
            });
        }
    }

    private handleLine(line: string): void {
        this.buffer.push(line);
        if (this.buffer.length >= LineReader.BUFFER_CAP) {
            this.reader.pause();
        }
    }
}

export default LineReader;