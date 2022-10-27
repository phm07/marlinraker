import { IGcodeMetadata } from "../../files/MetadataManager";
import MarlinRaker from "../../MarlinRaker";
import PrintJob from "./PrintJob";
import fs from "fs-extra";
import { rootDir } from "../../Server";
import path from "path";
import SimpleNotification from "../../api/notifications/SimpleNotification";

type THistoryJobStatus = "in_progress" | "completed" | "cancelled" | "error" | "klippy_shutdown" | "klippy_disconnect" | "server_exit";

interface IHistoryJob {
    job_id: string;
    exists: boolean;
    end_time: number | null;
    filament_used: number;
    filename: string;
    metadata: IGcodeMetadata;
    print_duration: number;
    status: THistoryJobStatus;
    start_time: number;
    total_duration: number;
}

interface IJobTotals {
    total_jobs: number;
    total_time: number;
    total_print_time: number;
    total_filament_used: number;
    longest_job: number;
    longest_print: number;
}

class JobHistory {

    public jobTotals: IJobTotals;
    private readonly marlinRaker: MarlinRaker;
    private history: IHistoryJob[];

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
        this.history = [];
        this.jobTotals = JobHistory.getDefaultJobTotals();
        void this.loadHistory();
    }

    private async loadHistory(): Promise<void> {
        this.history = (await this.marlinRaker.database.getItem("history", "jobs") ?? []) as IHistoryJob[];
        this.jobTotals = (await this.marlinRaker.database.getItem("history", "totals")
            ?? JobHistory.getDefaultJobTotals()) as IJobTotals;
    }

    public async getPrintHistory(limit: number, start: number, since: number, before: number, order: "asc" | "desc"): Promise<IHistoryJob[]> {
        return (await Promise.all(this.history
            .map(async (job) => ({
                ...job,
                exists: await fs.pathExists(path.join(rootDir, "gcodes", job.filename))
            }) as IHistoryJob)))
            .filter((job) => job.start_time < before && (job.end_time ?? Infinity) > since)
            .slice(start, start + limit).sort(
                (a, b) => {
                    return order === "asc" ? a.start_time - b.start_time : b.start_time - a.start_time;
                });
    }

    public async addJob(printJob: PrintJob): Promise<void> {
        if (!printJob.metadata) return;
        const id = this.findNextJobId();

        const job: IHistoryJob = {
            job_id: id,
            exists: true,
            end_time: null,
            filament_used: 0,
            print_duration: 0,
            start_time: this.marlinRaker.jobManager.startTime,
            status: "in_progress",
            total_duration: 0,
            filename: printJob.filename,
            metadata: printJob.metadata
        };
        printJob.historyJob = job;

        this.history.push(job);
        this.jobTotals.total_jobs++;

        await JobHistory.updateMetadata(printJob.filename, id, this.marlinRaker.jobManager.startTime);
        await this.saveTotals();
        await this.saveJobs();

        await this.marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_history_changed", [{
            action: "added",
            job
        }]));
    }

    public async finishJob(printJob: PrintJob, status: THistoryJobStatus): Promise<void> {

        const job = printJob.historyJob;
        if (!job) return;

        job.end_time = Date.now() / 1000;
        job.start_time = this.marlinRaker.jobManager.startTime;
        job.filament_used = this.marlinRaker.jobManager.getFilamentUsed();
        job.print_duration = this.marlinRaker.jobManager.printDuration;
        job.status = status;
        job.total_duration = this.marlinRaker.jobManager.totalDuration;

        this.jobTotals.longest_job = Math.max(this.jobTotals.longest_job, job.total_duration);
        this.jobTotals.total_time += job.total_duration;
        this.jobTotals.total_print_time += job.print_duration;
        this.jobTotals.total_filament_used += job.filament_used;
        this.jobTotals.longest_print = Math.max(this.jobTotals.longest_print, job.print_duration);

        await JobHistory.updateMetadata(job.filename, job.job_id, job.start_time);
        await this.saveTotals();
        await this.saveJobs();

        await this.marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_history_changed", [{
            action: "finished",
            job
        }]));
    }

    private static async updateMetadata(filename: string, id: string, timeStarted: number): Promise<void> {
        const metadata = await MarlinRaker.getInstance().metadataManager.getOrGenerateMetadata(filename);
        if (metadata) {
            metadata.job_id = id;
            metadata.print_start_time = timeStarted;
            await MarlinRaker.getInstance().metadataManager.storeMetadata(metadata);
        }
    }

    private async saveJobs(): Promise<void> {
        await this.marlinRaker.database.addItem("history", "jobs", this.history);
    }

    private async saveTotals(): Promise<void> {
        await this.marlinRaker.database.addItem("history", "totals", this.jobTotals);
    }

    public getJobFromId(id: string): IHistoryJob | null {
        return this.history.find((job) => job.job_id === id) ?? null;
    }

    public async deleteJobs(uid: string, all: boolean): Promise<string[]> {
        const deleted = [];
        const leftOver: IHistoryJob[] = [];
        for (const job of this.history) {
            if (all || job.job_id === uid) {
                deleted.push(job.job_id);
            } else {
                leftOver.push(job);
            }
        }
        this.history = leftOver;
        await this.saveJobs();
        await this.marlinRaker.metadataManager.removeJobIds(deleted);
        return deleted;
    }

    public resetTotals(): void {
        this.jobTotals = JobHistory.getDefaultJobTotals();
    }

    private findNextJobId(): string {
        let counter = 1;
        let id: string;
        do {
            id = (counter++).toString().padStart(6, "0");
        } while (this.history.some((job) => job.job_id === id));
        return id;
    }

    private static getDefaultJobTotals(): IJobTotals {
        return {
            total_jobs: 0,
            total_time: 0,
            total_print_time: 0,
            total_filament_used: 0,
            longest_job: 0,
            longest_print: 0
        };
    }
}

export { IHistoryJob, IJobTotals, THistoryJobStatus };
export default JobHistory;