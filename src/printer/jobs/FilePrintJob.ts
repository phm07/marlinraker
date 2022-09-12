import PrintJob, { TState } from "./PrintJob";
import path from "path";
import fs from "fs-extra";
import { marlinRaker, rootDir } from "../../Server";
import LineReader from "../../files/LineReader";
import { TGcodeMetadata } from "../../files/MetadataManager";

class FilePrintJob extends PrintJob {

    public readonly filename: string;
    public readonly filepath: string;
    public state: TState;
    public filePosition: number;
    public progress: number;
    private fileSize?: number;
    private metadata?: TGcodeMetadata;
    private lineReader?: LineReader;
    private latestCommand?: Promise<string>;
    private onPausedListener?: () => void;

    public constructor(filename: string) {
        super();
        this.filename = filename;
        this.filepath = path.join(rootDir, "gcodes", filename);
        this.state = "standby";
        this.filePosition = 0;
        this.progress = 0;

        marlinRaker.printer?.on("commandOk", async () => {
            await this.flush();
        });
    }

    public async start(): Promise<void> {
        if (this.state !== "standby") throw "Job already started";
        const metadata = await marlinRaker.metadataManager.getOrGenerateMetadata(this.filename);
        let stat = null;
        try {
            stat = await fs.stat(this.filepath);
        } catch (_) {
            //
        }
        if (!metadata || !stat) throw "Cannot find file";
        this.metadata = metadata;
        this.fileSize = stat.size;
        this.setState("printing");
        await marlinRaker.printer!.queueGcode("M75 " + this.filename, false, false);
        this.lineReader = new LineReader(fs.createReadStream(this.filepath));
        this.flush().then();
    }

    public async finish(): Promise<void> {
        await marlinRaker.printer!.queueGcode("M77", false, false);
        this.setState("complete");
        this.progress = 1;
    }

    private async flush(): Promise<void> {
        const printer = marlinRaker.printer!;
        if (!this.lineReader) return;

        if (this.state !== "printing") {
            if (this.onPausedListener) {
                this.onPausedListener();
                delete this.onPausedListener;
            }
            return;
        }

        let nextCommand: string | null = null;
        do {
            if (!this.lineReader.hasNextLine()) {
                await this.finish();
                return;
            }
            nextCommand = (await this.lineReader.readLine())?.split(";")?.[0] ?? null;
        } while (!nextCommand || nextCommand.trim().startsWith(";"));

        const position = this.lineReader.position;
        this.latestCommand = printer.queueGcode(nextCommand, false, false);

        this.latestCommand.then(() => {
            this.filePosition = position;
            const start = this.metadata?.gcode_start_byte ?? 0;
            const end = this.metadata?.gcode_end_byte ?? this.fileSize ?? 0;
            this.progress = Math.min(1, Math.max(0, (position - start) / (end - start)));
        });
    }

    public async pause(): Promise<void> {
        if (this.state !== "printing") return;
        const promise = new Promise<void>((resolve) => {
            this.onPausedListener = async (): Promise<void> => {
                await this.latestCommand;
                resolve();
            };
        });
        this.setState("paused");
        await promise;
    }

    public async resume(): Promise<void> {
        if (this.state !== "paused") return;
        this.setState("printing");
        this.flush().then();
    }

    public async cancel(): Promise<void> {
        delete this.lineReader;
        const promise = new Promise<void>((resolve) => {
            this.onPausedListener = async (): Promise<void> => {
                await this.latestCommand;
                resolve();
            };
        });
        this.setState("cancelled");
        await promise;
        await marlinRaker.printer!.queueGcode("M77");
    }
}

export default FilePrintJob;