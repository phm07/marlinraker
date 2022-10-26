import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IJobTotals } from "../../printer/jobs/JobHistory";
import MarlinRaker from "../../MarlinRaker";

interface IResult {
    last_totals: IJobTotals;
}

class ServerHistoryResetTotals implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.history.reset_totals";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): IResult {
        const totals = this.marlinRaker.jobHistory.jobTotals;
        this.marlinRaker.jobHistory.resetTotals();
        return { last_totals: totals };
    }
}

export default ServerHistoryResetTotals;