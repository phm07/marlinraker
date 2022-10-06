import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { ICompletedJob } from "../../printer/jobs/JobHistory";
import { marlinRaker } from "../../Server";

interface IParams {
    limit: number;
    start: number;
    since: number;
    before: number;
    order: string;
}

interface IResult {
    count: number;
    jobs: ICompletedJob[];
}

class ServerHistoryListExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.history.list";

    public invoke(_: TSender, params: Partial<IParams>): IResult {
        const jobs = marlinRaker.jobHistory.getPrintHistory(params.limit ?? 50, params.start ?? 0,
            params.since ?? -Infinity, params.before ?? Infinity,
            params.order === "asc" ? "asc" : "desc");
        return {
            count: jobs.length,
            jobs
        };
    }
}

export default ServerHistoryListExecutor;