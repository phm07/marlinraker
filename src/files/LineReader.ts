import { ReadStream } from "fs";
import readline, { Interface } from "readline";

class LineReader {

    private static readonly BUFFER_CAP = 100;

    public position: number;
    private readonly reader: Interface;
    private moreToRead: boolean;
    private paused: boolean;
    private readonly buffer: string[];

    public constructor(stream: ReadStream) {
        this.buffer = [];
        this.position = 0;
        this.moreToRead = true;
        this.paused = false;

        stream.on("end", () => {
            this.moreToRead = false;
            this.reader.emit("line", null);
        });

        this.reader = readline.createInterface(stream);
        this.reader.prependListener("line", this.handleLine.bind(this));
        this.reader.on("pause", () => this.paused = true);
        this.reader.on("resume", () => this.paused = false);
    }

    public close(): void {
        this.reader.close();
    }

    public hasNextLine(): boolean {
        return this.moreToRead || this.buffer.length > 0;
    }

    public async readLine(): Promise<string | null> {
        if (!this.hasNextLine()) return null;
        if (this.paused && this.buffer.length < LineReader.BUFFER_CAP) {
            this.reader.resume();
        }
        if (this.buffer.length) {
            const line = this.buffer.shift()!;
            this.position += Buffer.byteLength(line, "utf-8") + 1; // \n
            return line;
        }
        return new Promise<string | null>((resolve) => {
            this.reader.once("line", (line: string) => {
                resolve(line);
            });
        });
    }

    private handleLine(line: string): void {
        this.buffer.push(line);
        if (this.buffer.length >= LineReader.BUFFER_CAP) {
            this.reader.pause();
        }
    }
}

export default LineReader;