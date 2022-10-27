import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IProcStats } from "../../system/ProcStats";
import MarlinRaker from "../../MarlinRaker";

class MachineProcStatsExecutor implements IMethodExecutor<undefined, IProcStats | {}> {

    public readonly name = "machine.proc_stats";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): IProcStats | {} {
        return this.marlinRaker.systemInfo.procStats.getProcStats();
    }
}

export default MachineProcStatsExecutor;