import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IJobTotals } from "../../printer/jobs/JobHistory";
import { marlinRaker } from "../../Server";

interface IResult {
    last_totals: IJobTotals;
}

class ServerHistoryResetTotals implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.history.reset_totals";

    public invoke(_: TSender, __: undefined): IResult {
        const totals = marlinRaker.jobHistory.jobTotals;
        marlinRaker.jobHistory.resetTotals();
        return { last_totals: totals };
    }
}

export default ServerHistoryResetTotals;