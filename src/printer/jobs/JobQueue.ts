import { IQueuedJob } from "./IQueuedJob";

type TQueueState = "ready" | "loading" | "starting" | "paused";

class JobQueue {

    public state: TQueueState;
    public queue: IQueuedJob[];

    public constructor() {
        this.state = "ready";
        this.queue = [];
    }
}

export default JobQueue;
export { TQueueState };