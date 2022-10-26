import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TQueueState } from "../../printer/jobs/JobQueue";
import MarlinRaker from "../../MarlinRaker";

interface IResult {
    queued_jobs: {
        filename: string;
        job_id: string;
        time_added: number;
        time_in_queue: number;
    }[];
    queue_state: TQueueState;
}

class ServerJobQueueStatusExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.job_queue.status";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): IResult {
        return {
            queue_state: this.marlinRaker.jobManager.jobQueue.state,
            queued_jobs: this.marlinRaker.jobManager.jobQueue.queue.map((job) => ({
                filename: job.filename,
                job_id: job.jobId,
                time_added: job.timeAdded,
                time_in_queue: job.timeInQueue
            }))
        };
    }
}

export default ServerJobQueueStatusExecutor;