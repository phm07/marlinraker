import { config } from "../../Server";
import JobQueue from "./JobQueue";
import PrintJob from "./PrintJob";
import MarlinRaker from "../../MarlinRaker";
import EventEmitter from "events";
import { THistoryJobStatus } from "./JobHistory";

type TJobStatus = "standby" | "printing" | "paused" | "complete" | "cancelled" | "error";

declare interface JobManager {
    on(event: "stateChange", listener: (state: TJobStatus) => void): this;
    on(event: "durationUpdate" | "progressUpdate", listener: () => void): this;
    emit(eventName: "stateChange", state: TJobStatus): boolean;
    emit(eventName: "durationUpdate" | "progressUpdate"): boolean;
}

class JobManager extends EventEmitter {

    public state: TJobStatus;
    public readonly jobQueue: JobQueue;
    public currentPrintJob?: PrintJob;
    public totalDuration!: number;
    public printDuration!: number;
    public startTime!: number;
    private readonly marlinRaker: MarlinRaker;
    private ePosStart!: number;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;
        this.state = "standby";
        this.jobQueue = new JobQueue();
        this.resetStats();

        setInterval(() => {
            if (!marlinRaker.printer) return;
            if (this.state === "printing"
                || this.state === "paused") {
                this.totalDuration++;
                if (this.state === "printing") {
                    this.printDuration++;
                }
            }
            this.emit("durationUpdate");
        }, 1000);

        if (config.getBoolean("printer.gcode.send_m73", true)) {
            let lastReportedProgress = 0;
            setInterval(async () => {
                if (!marlinRaker.printer || !marlinRaker.printer.isM73Supported) return;
                const progress = this.currentPrintJob?.progress;
                if (progress && lastReportedProgress !== progress) {
                    lastReportedProgress = progress;
                    this.emit("progressUpdate");
                    await marlinRaker.printer.queueGcode(`M73 P${Math.round(progress * 100)}`, false, false);
                }
            }, 1000);
        }

        marlinRaker.on("stateChange", async (state) => {
            if (state === "shutdown" || state === "error") {
                await this.finishJob("klippy_shutdown");
                delete this.currentPrintJob;
                this.resetStats();
                this.state = "standby";
            }
        });
    }

    public async selectFile(filename: string): Promise<boolean> {
        const printer = this.marlinRaker.printer;
        if (!/\.gcode$/i.test(filename)) return false;
        if (!printer || this.isPrinting()) return false;

        const file = await this.marlinRaker.fileManager.getFile(filename);
        const printJob = file?.getPrintJob?.();
        if (!printJob) return false;

        this.currentPrintJob = printJob;
        delete printer.pauseState;
        this.resetStats();
        return true;
    }

    public async start(): Promise<boolean> {
        if (!this.isReadyToPrint()) return false;
        this.resetStats();
        this.startTime = Date.now() / 1000;
        this.ePosStart = this.marlinRaker.printer!.getExtrudedFilament();
        await this.currentPrintJob!.start();
        await this.setState("printing");
        await this.marlinRaker.jobHistory.addJob(this.currentPrintJob!);
        return true;
    }

    public async pause(): Promise<boolean> {
        const printer = this.marlinRaker.printer;
        if (!printer || !this.currentPrintJob || this.state !== "printing") return false;
        await this.currentPrintJob.pause();
        await this.setState("paused");
        printer.pauseState = {
            x: printer.gcodePosition[0],
            y: printer.gcodePosition[1],
            feedrate: printer.feedrate,
            isAbsolute: printer.isAbsolutePositioning,
            isAbsoluteE: printer.isAbsoluteEPositioning
        };
        return true;
    }

    public async resume(): Promise<boolean> {
        if (!this.marlinRaker.printer || !this.currentPrintJob || this.state !== "paused") return false;
        delete this.marlinRaker.printer.pauseState;
        await this.setState("printing");
        await this.currentPrintJob.resume();
        return true;
    }

    public async cancel(): Promise<boolean> {
        if (!this.marlinRaker.printer || !this.isPrinting()) return false;
        delete this.marlinRaker.printer.pauseState;
        await this.currentPrintJob!.cancel();
        await this.setState("cancelled");
        return true;
    }

    public async reset(): Promise<boolean> {

        const printer = this.marlinRaker.printer;
        if (!printer
            || !this.currentPrintJob
            || this.isPrinting())
            return false;

        await printer.queueGcode("M117", false, false);
        delete printer.pauseState;
        delete this.currentPrintJob;
        this.resetStats();
        await this.setState("standby");
        return true;
    }

    public isPrinting(): boolean {
        if (!this.currentPrintJob) return false;
        return ["printing", "paused"].includes(this.state);
    }

    public isReadyToPrint(): boolean {
        if (!this.marlinRaker.printer || this.marlinRaker.updateManager.busy || !this.currentPrintJob) return false;
        return ["standby", "complete", "cancelled", "error"].includes(this.state);
    }

    public getFilamentUsed(): number {
        const extrudedFilament = this.marlinRaker.printer?.getExtrudedFilament();
        return extrudedFilament ? extrudedFilament - this.ePosStart : 0;
    }

    private resetStats(): void {
        this.totalDuration = 0;
        this.printDuration = 0;
        this.startTime = 0;
        this.ePosStart = 0;
    }

    public async setState(state: TJobStatus): Promise<void> {
        this.state = state;
        this.emit("stateChange", state);
        if (["complete", "error", "cancelled"].includes(state)) {
            const status = state === "complete" ? "completed" : state as THistoryJobStatus;
            await this.finishJob(status);
        }
    }

    public async finishJob(status: THistoryJobStatus): Promise<void> {
        if (!this.currentPrintJob) return;
        await this.marlinRaker.jobHistory.finishJob(this.currentPrintJob, status);
    }
}

export default JobManager;