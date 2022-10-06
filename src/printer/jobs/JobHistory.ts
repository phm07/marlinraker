import { IGcodeMetadata } from "../../files/MetadataManager";
import { marlinRaker } from "../../Server";
import Database from "../../database/Database";

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

class JobHistory {

    public jobTotals: IJobTotals;
    private readonly database: Database;
    private completedJobs: ICompletedJob[];

    public constructor(database: Database) {
        this.database = database;
        this.completedJobs = [];
        this.jobTotals = JobHistory.getDefaultJobTotals();
        void this.loadHistory();

        process.on("exit", async () => {
            await this.saveCurrentJob("server_exit");
        });
    }

    private async loadHistory(): Promise<void> {
        this.completedJobs = (await this.database.getItem("history", "jobs") ?? []) as ICompletedJob[];
        this.jobTotals = (await this.database.getItem("history", "totals")
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
        if (!marlinRaker.jobManager.currentPrintJob) return;

        const jobState = marlinRaker.jobManager.currentPrintJob.state;
        if (!["complete", "cancelled", "error"].includes(jobState)) return;

        const metadata = marlinRaker.jobManager.currentPrintJob.metadata;
        if (!metadata) return;

        this.completedJobs.push({
            job_id: id,
            exists: true,
            end_time: Date.now() / 1000,
            filament_used: marlinRaker.jobManager.getFilamentUsed(),
            print_duration: marlinRaker.jobManager.printDuration,
            start_time: marlinRaker.jobManager.startTime,
            status,
            total_duration: marlinRaker.jobManager.totalDuration,
            filename: marlinRaker.jobManager.currentPrintJob.filename,
            metadata
        });

        this.jobTotals.total_jobs++;
        this.jobTotals.longest_job = Math.max(this.jobTotals.longest_job, marlinRaker.jobManager.totalDuration);
        this.jobTotals.total_time += marlinRaker.jobManager.totalDuration;
        this.jobTotals.total_print_time += marlinRaker.jobManager.printDuration;
        this.jobTotals.total_filament_used += marlinRaker.jobManager.getFilamentUsed();
        this.jobTotals.longest_print = Math.max(this.jobTotals.longest_print, marlinRaker.jobManager.printDuration);

        await JobHistory.updateMetadata(marlinRaker.jobManager.currentPrintJob.filename, id, marlinRaker.jobManager.startTime);
        await this.saveTotals();
        await this.saveJobs();
    }

    private static async updateMetadata(filename: string, id: string, timeStarted: number): Promise<void> {
        const metadata = await marlinRaker.metadataManager.getOrGenerateMetadata(filename);
        if (metadata) {
            metadata.job_id = id;
            metadata.print_start_time = timeStarted;
            await marlinRaker.metadataManager.storeMetadata(metadata);
        }
    }

    private async saveJobs(): Promise<void> {
        await this.database.addItem("history", "jobs", this.completedJobs);
    }

    private async saveTotals(): Promise<void> {
        await this.database.addItem("history", "totals", this.jobTotals);
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
        await marlinRaker.metadataManager.removeJobIds(deleted);
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

export { ICompletedJob, IJobTotals, TCompletedJobStatus };
export default JobHistory;