import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { ICompletedJob } from "../../printer/jobs/JobHistory";
import { marlinRaker } from "../../Server";

interface IParams {
    uid: string;
}

interface IResult {
    job: ICompletedJob;
}

class ServerHistoryGetJobExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.history.get_job";
    public readonly httpName = "server.history.job";

    public invoke(_: TSender, params: Partial<IParams>): IResult {
        if (!params.uid) throw new Error("No uid specified");
        const job = marlinRaker.jobHistory.getJobFromId(params.uid);
        if (!job) throw new Error("Job doesn't exist");
        return { job };
    }
}

export default ServerHistoryGetJobExecutor;