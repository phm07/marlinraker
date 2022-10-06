import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IJobTotals } from "../../printer/jobs/JobHistory";
import { marlinRaker } from "../../Server";

interface IResult {
    job_totals: IJobTotals;
}

class ServerHistoryTotals implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.history.totals";

    public invoke(_: TSender, __: undefined): IResult {
        return { job_totals: marlinRaker.jobHistory.jobTotals };
    }
}

export default ServerHistoryTotals;