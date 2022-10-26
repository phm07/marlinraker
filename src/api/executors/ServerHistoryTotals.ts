import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IJobTotals } from "../../printer/jobs/JobHistory";
import MarlinRaker from "../../MarlinRaker";

interface IResult {
    job_totals: IJobTotals;
}

class ServerHistoryTotals implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.history.totals";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): IResult {
        return { job_totals: this.marlinRaker.jobHistory.jobTotals };
    }
}

export default ServerHistoryTotals;