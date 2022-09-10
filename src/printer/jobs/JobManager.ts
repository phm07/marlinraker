import { marlinRaker } from "../../Server";
import JobQueue from "./JobQueue";
import PrintJob from "./PrintJob";

class JobManager {

    public readonly jobQueue: JobQueue;
    public currentPrintJob?: PrintJob;
    public totalDuration: number;
    public printDuration: number;
    private resumePosition?: [number, number];
    private resumeIsAbsolute?: boolean;
    private resumeIsEAbsolute?: boolean;
    private resumeFeedrate?: number;

    public constructor() {
        this.jobQueue = new JobQueue();
        this.totalDuration = 0;
        this.printDuration = 0;

        setInterval(() => {
            const state = this.currentPrintJob?.state;
            if (!state) return;
            if (state === "printing"
                || state === "paused") {
                this.totalDuration++;
                if (state === "printing") {
                    this.printDuration++;
                }
            }
            marlinRaker.printer?.objectManager.objects["print_stats"]?.emit();
        }, 1000);

        let lastReportedProgress = 0;
        setInterval(async () => {
            const progress = this.currentPrintJob?.progress;
            if (progress && lastReportedProgress !== progress) {
                lastReportedProgress = progress;
                marlinRaker.printer?.objectManager.objects["virtual_sdcard"]?.emit();
                await marlinRaker.printer?.queueGcode(`M73 P${Math.round(progress * 100)}`, false, false);
            }
        }, 1000);
    }

    public async startPrintJob(filename: string): Promise<boolean> {
        if (!marlinRaker.printer) return false;
        if(marlinRaker.updateManager.busy) return false;

        if (this.isPrinting()) {
            return false;
        }

        const file = await marlinRaker.fileManager.getFile(filename);
        const printJob = file?.getPrintJob?.();
        if (!printJob) return false;

        delete this.resumePosition;
        delete this.resumeIsAbsolute;
        delete this.resumeIsEAbsolute;
        delete this.resumeFeedrate;
        this.currentPrintJob = printJob;
        printJob.on("stateChange", () => {
            marlinRaker.printer!.objectManager.objects["print_stats"]?.emit();
            marlinRaker.printer!.objectManager.objects["virtual_sdcard"]?.emit();
        });
        await printJob.start();
        return true;
    }

    public async pause(): Promise<boolean> {
        if (!marlinRaker.printer) return false;
        if (this.currentPrintJob?.state !== "printing") return false;
        await this.currentPrintJob.pause();
        this.resumePosition = marlinRaker.printer.toolheadPosition.slice(0, 2) as [number, number];
        this.resumeIsAbsolute = marlinRaker.printer.isAbsolutePositioning;
        this.resumeIsEAbsolute = marlinRaker.printer.isAbsoluteEPositioning;
        this.resumeFeedrate = marlinRaker.printer.feedrate;
        return true;
    }

    public async resume(): Promise<boolean> {
        if (!marlinRaker.printer) return false;
        if (this.currentPrintJob?.state !== "paused") return false;
        const printer = marlinRaker.printer;

        await printer.queueGcode(`G90\nG1 X${this.resumePosition?.[0] ?? 0} Y${this.resumePosition?.[1] ?? 0} F6000`);

        if (this.resumeIsAbsolute !== printer.isAbsolutePositioning) {
            await printer.queueGcode(this.resumeIsAbsolute ? "G90" : "G91", false, false);
        }
        if (this.resumeIsEAbsolute !== printer.isAbsoluteEPositioning) {
            await printer.queueGcode(this.resumeIsEAbsolute ? "M82" : "M83", false, false);
        }
        if (this.resumeFeedrate !== printer.feedrate) {
            await printer.queueGcode("G0 F" + this.resumeFeedrate, false, false);
        }

        delete this.resumeIsAbsolute;
        delete this.resumeIsEAbsolute;
        delete this.resumePosition;
        delete this.resumeFeedrate;
        await this.currentPrintJob.resume();
        return true;
    }

    public async cancel(): Promise<boolean> {
        if (!marlinRaker.printer) return false;
        if (!this.isPrinting()) return false;
        await this.currentPrintJob!.cancel();
        return true;
    }

    public reset(): boolean {

        if (!marlinRaker.printer
            || !this.currentPrintJob
            || this.isPrinting())
            return false;

        delete this.currentPrintJob;
        this.totalDuration = 0;
        this.printDuration = 0;
        marlinRaker.printer.objectManager.objects["print_stats"]?.emit();
        marlinRaker.printer.objectManager.objects["virtual_sdcard"]?.emit();
        return true;
    }

    public isPrinting(): boolean {
        return this.currentPrintJob?.state === "printing" || this.currentPrintJob?.state === "paused";
    }
}

export default JobManager;