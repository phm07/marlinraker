import { config, marlinRaker } from "../../Server";
import JobQueue from "./JobQueue";
import PrintJob from "./PrintJob";
import MarlinRaker from "../../MarlinRaker";

class JobManager {

    public readonly jobQueue: JobQueue;
    public currentPrintJob?: PrintJob;
    public totalDuration: number;
    public printDuration: number;
    public startTime: number;
    private ePosStart: number;

    public constructor(marlinRakerInstance: MarlinRaker) {
        this.jobQueue = new JobQueue();
        this.totalDuration = 0;
        this.printDuration = 0;
        this.startTime = 0;
        this.ePosStart = 0;

        setInterval(() => {
            if (!marlinRaker.printer) return;
            const state = this.currentPrintJob?.state;
            if (!state) return;
            if (state === "printing"
                || state === "paused") {
                this.totalDuration++;
                if (state === "printing") {
                    this.printDuration++;
                }
            }
            marlinRaker.printer.objectManager.objects.print_stats?.emit();
        }, 1000);

        if (config.getBoolean("printer.gcode.send_m73", true)) {
            let lastReportedProgress = 0;
            setInterval(async () => {
                if (!marlinRaker.printer || !marlinRaker.printer.isM73Supported) return;
                const progress = this.currentPrintJob?.progress;
                if (progress && lastReportedProgress !== progress) {
                    lastReportedProgress = progress;
                    marlinRaker.printer.objectManager.objects.virtual_sdcard?.emit();
                    await marlinRaker.printer.queueGcode(`M73 P${Math.round(progress * 100)}`, false, false);
                }
            }, 1000);
        }

        marlinRakerInstance.on("stateChange", (state) => {
            if (state !== "ready") {
                delete this.currentPrintJob;
                this.totalDuration = 0;
                this.printDuration = 0;
                this.startTime = 0;
                this.ePosStart = 0;
            }
        });
    }

    public async selectFile(filename: string): Promise<boolean> {
        const printer = marlinRaker.printer;
        if (!printer || this.isPrinting()) return false;

        const file = await marlinRaker.fileManager.getFile(filename);
        const printJob = file?.getPrintJob?.();
        if (!printJob) return false;

        this.currentPrintJob = printJob;
        printJob.on("stateChange", () => {
            marlinRaker.printer!.objectManager.objects.print_stats?.emit();
            marlinRaker.printer!.objectManager.objects.virtual_sdcard?.emit();
        });
        delete printer.pauseState;
        return true;
    }

    public async start(): Promise<boolean> {
        if (!this.isReadyToPrint()) return false;
        this.startTime = Date.now() / 1000;
        this.ePosStart = marlinRaker.printer!.getExtrudedFilament();
        await this.currentPrintJob!.start();
        return true;
    }

    public async pause(): Promise<boolean> {
        const printer = marlinRaker.printer;
        if (!printer || this.currentPrintJob?.state !== "printing") return false;
        await this.currentPrintJob.pause();
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
        if (!marlinRaker.printer || this.currentPrintJob?.state !== "paused") return false;
        delete marlinRaker.printer.pauseState;
        await this.currentPrintJob.resume();
        return true;
    }

    public async cancel(): Promise<boolean> {
        if (!marlinRaker.printer || !this.isPrinting()) return false;
        delete marlinRaker.printer.pauseState;
        await this.currentPrintJob!.cancel();
        return true;
    }

    public async reset(): Promise<boolean> {

        const printer = marlinRaker.printer;
        if (!printer
            || !this.currentPrintJob
            || this.isPrinting())
            return false;

        await printer.queueGcode("M117", false, false);
        delete printer.pauseState;
        delete this.currentPrintJob;
        this.totalDuration = 0;
        this.printDuration = 0;
        this.startTime = 0;
        this.ePosStart = 0;
        printer.objectManager.objects.print_stats?.emit();
        printer.objectManager.objects.virtual_sdcard?.emit();
        return true;
    }

    public isPrinting(): boolean {
        if (!this.currentPrintJob) return false;
        return ["printing", "paused"].includes(this.currentPrintJob.state);
    }

    public isReadyToPrint(): boolean {
        if (!marlinRaker.printer || marlinRaker.updateManager.busy || !this.currentPrintJob) return false;
        return ["standby", "complete", "cancelled"].includes(this.currentPrintJob.state);
    }

    public getFilamentUsed(): number {
        return (marlinRaker.printer?.getExtrudedFilament() ?? 0) - this.ePosStart;
    }
}

export default JobManager;