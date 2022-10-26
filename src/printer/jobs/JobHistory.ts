import { IGcodeMetadata } from "../../files/MetadataManager";
import MarlinRaker from "../../MarlinRaker";

type TCompletedJobStatus = "completed" | "cancelled" | "error" | "klippy_shutdown" | "klippy_disconnect" | "server_exit";

interface ICompletedJob {
    job_id: string;
    exists: boolean;
    end_time: number;
    filament_used: number;
    filename: string;
    metadata: IGcodeMetadata;
    print_duration: number;
    status: TCompletedJobStatus;
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

export { ICompletedJob, IJobTotals, TCompletedJobStatus };

class JobHistory {

    public jobTotals: IJobTotals;
    private readonly marlinRaker: MarlinRaker;
    private completedJobs: ICompletedJob[];

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
        this.completedJobs = [];
        this.jobTotals = JobHistory.getDefaultJobTotals();
        void this.loadHistory();

        process.on("exit", async () => {
            await this.saveCurrentJob("server_exit");
        });
    }

    private async loadHistory(): Promise<void> {
        this.completedJobs = (await this.marlinRaker.database.getItem("history", "jobs") ?? []) as ICompletedJob[];
        this.jobTotals = (await this.marlinRaker.database.getItem("history", "totals")
            ?? JobHistory.getDefaultJobTotals()) as IJobTotals;
    }

    public getPrintHistory(limit: number, start: number, since: number, before: number, order: "asc" | "desc"): ICompletedJob[] {
        return this.completedJobs.filter((job) => job.start_time < before && job.end_time > since)
            .slice(start, start + limit).sort(
                (a, b) => {
                    return order === "asc" ? a.start_time - b.start_time : b.start_time - a.start_time;
                });
    }

    public async saveCurrentJob(status: TCompletedJobStatus): Promise<void> {
        const id = this.findNextJobId();
        if (!this.marlinRaker.jobManager.currentPrintJob) return;

        const metadata = this.marlinRaker.jobManager.currentPrintJob.metadata;
        if (!metadata) return;

        this.completedJobs.push({
            job_id: id,
            exists: true,
            end_time: Date.now() / 1000,
            filament_used: this.marlinRaker.jobManager.getFilamentUsed(),
            print_duration: this.marlinRaker.jobManager.printDuration,
            start_time: this.marlinRaker.jobManager.startTime,
            status,
            total_duration: this.marlinRaker.jobManager.totalDuration,
            filename: this.marlinRaker.jobManager.currentPrintJob.filename,
            metadata
        });

        this.jobTotals.total_jobs++;
        this.jobTotals.longest_job = Math.max(this.jobTotals.longest_job, this.marlinRaker.jobManager.totalDuration);
        this.jobTotals.total_time += this.marlinRaker.jobManager.totalDuration;
        this.jobTotals.total_print_time += this.marlinRaker.jobManager.printDuration;
        this.jobTotals.total_filament_used += this.marlinRaker.jobManager.getFilamentUsed();
        this.jobTotals.longest_print = Math.max(this.jobTotals.longest_print, this.marlinRaker.jobManager.printDuration);

        await JobHistory.updateMetadata(this.marlinRaker.jobManager.currentPrintJob.filename, id, this.marlinRaker.jobManager.startTime);
        await this.saveTotals();
        await this.saveJobs();
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
        await this.marlinRaker.database.addItem("history", "jobs", this.completedJobs);
    }

    private async saveTotals(): Promise<void> {
        await this.marlinRaker.database.addItem("history", "totals", this.jobTotals);
    }

    public getJobFromId(id: string): ICompletedJob | null {
        return this.completedJobs.find((job) => job.job_id === id) ?? null;
    }

    public async deleteJobs(uid: string, all: boolean): Promise<string[]> {
        const deleted = [];
        const leftOver: ICompletedJob[] = [];
        for (const job of this.completedJobs) {
            if (all || job.job_id === uid) {
                deleted.push(job.job_id);
            } else {
                leftOver.push(job);
            }
        }
        this.completedJobs = leftOver;
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
        } while (this.completedJobs.some((job) => job.job_id === id));
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
export default JobHistory;