import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IHistoryJob } from "../../printer/jobs/JobHistory";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    limit: number;
    start: number;
    since: number;
    before: number;
    order: string;
}

interface IResult {
    count: number;
    jobs: IHistoryJob[];
}

class ServerHistoryListExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.history.list";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IResult> {
        const jobs = await this.marlinRaker.jobHistory.getPrintHistory(params.limit ?? 50, params.start ?? 0,
            params.since ?? -Infinity, params.before ?? Infinity,
            params.order === "asc" ? "asc" : "desc");
        return {
            count: jobs.length,
            jobs
        };
    }
}

export default ServerHistoryListExecutor;