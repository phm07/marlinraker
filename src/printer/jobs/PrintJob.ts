import path from "path";
import fs from "fs-extra";
import { rootDir } from "../../Server";
import LineReader from "../../files/LineReader";
import { IGcodeMetadata } from "../../files/MetadataManager";
import Printer from "../Printer";
import EventEmitter from "events";
import MarlinRaker from "../../MarlinRaker";
import { IHistoryJob } from "./JobHistory";

class PrintJob extends EventEmitter {

    public readonly filename: string;
    public readonly filepath: string;
    public readonly fileSize: number;
    public historyJob?: IHistoryJob;
    public filePosition: number;
    public progress: number;
    public metadata?: IGcodeMetadata;
    private readonly marlinRaker: MarlinRaker;
    private readonly printer: Printer;
    private lineReader?: LineReader;
    private latestCommand?: Promise<string>;
    private onPausedListener?: () => void;
    private pauseRequested: boolean;

    public constructor(filename: string) {
        super();
        this.marlinRaker = MarlinRaker.getInstance();
        if (!this.marlinRaker.printer) throw new Error();

        this.printer = this.marlinRaker.printer;
        this.filename = filename;
        this.filepath = path.join(rootDir, "gcodes", filename);
        this.filePosition = 0;
        this.progress = 0;
        this.pauseRequested = false;

        this.printer.on("commandOk", async () => {
            await this.flush();
        });

        try {
            this.fileSize = fs.statSync(this.filepath).size;
        } catch (_) {
            this.fileSize = 0;
        }
    }

    public async start(): Promise<void> {
        this.metadata = await this.marlinRaker.metadataManager.getOrGenerateMetadata(this.filename) ?? undefined;
        if (!this.fileSize || !this.metadata) throw new Error("Cannot find file");
        this.pauseRequested = false;
        this.lineReader = new LineReader(fs.createReadStream(this.filepath));
        this.flush().then();
    }

    public async finish(): Promise<void> {
        await this.waitForPrintMoves();
        if (!this.printer.isPrusa) {
            await this.printer.queueGcode("M77", false, false);
        }
        await this.marlinRaker.jobManager.setState("complete");
        this.progress = 1;
    }

    private async flush(): Promise<void> {
        if (!this.lineReader) return;

        if (this.pauseRequested) {
            if (this.onPausedListener) {
                this.onPausedListener();
                delete this.onPausedListener;
            }
            return;
        }

        if (this.marlinRaker.jobManager.state !== "printing" || this.printer.hasCommandsInQueue()) return;

        let nextCommand: string | null = null;
        do {
            nextCommand = (await this.lineReader.readLine())?.split(";")?.[0] ?? null;
        } while (nextCommand !== null && !nextCommand.trim());

        if (!nextCommand) {
            delete this.lineReader;
            await this.finish();
            return;
        }

        const position = this.lineReader.position;
        this.latestCommand = this.printer.queueGcode(nextCommand, false, false);

        this.latestCommand.then(async () => {
            this.filePosition = position;
            const start = (await this.metadata)?.gcode_start_byte ?? 0;
            const end = (await this.metadata)?.gcode_end_byte ?? this.fileSize;
            this.progress = Math.min(1, Math.max(0, (position - start) / (end - start)));
        });
    }

    public async pause(): Promise<void> {
        if (this.pauseRequested) return;
        const promise = new Promise<void>((resolve) => {
            this.onPausedListener = resolve.bind(this);
        });
        this.pauseRequested = true;
        await promise;
        await this.waitForPrintMoves();
    }

    public async resume(): Promise<void> {
        this.pauseRequested = false;
        this.flush().then();
    }

    public async cancel(): Promise<void> {
        if (!this.pauseRequested) {
            const promise = new Promise<void>((resolve) => {
                this.onPausedListener = resolve.bind(this);
            });
            this.pauseRequested = true;
            await promise;
        }
        await this.waitForPrintMoves();
    }

    private async waitForPrintMoves(): Promise<void> {
        await this.latestCommand;
        await this.printer.queueGcode("M400", false, false);
    }
}

export { PrintJob };
export default PrintJob;