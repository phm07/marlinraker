import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TQueueState } from "../../printer/jobs/JobQueue";
import { marlinRaker } from "../../Server";

interface IResult {
    queued_jobs: {
        filename: string;
        job_id: string;
        time_added: number;
        time_in_queue: number;
    }[];
    queue_state: TQueueState;
}

class ServerJobQueueStatus implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.job_queue.status";

    public invoke(_: TSender, __: undefined): IResult {
        return {
            queue_state: marlinRaker.jobManager.jobQueue.state,
            queued_jobs: marlinRaker.jobManager.jobQueue.queue.map((job) => ({
                filename: job.filename,
                job_id: job.jobId,
                time_added: job.timeAdded,
                time_in_queue: job.timeInQueue
            }))
        };
    }
}

export default ServerJobQueueStatus;