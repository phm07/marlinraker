import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IProcStats } from "../../system/ProcStats";
import { marlinRaker } from "../../Server";

class MachineProcStatsExecutor implements IMethodExecutor<undefined, IProcStats | {}> {

    public readonly name = "machine.proc_stats";

    public invoke(_: TSender, __: undefined): IProcStats | {} {
        return marlinRaker.systemInfo.procStats?.getProcStats() ?? {};
    }
}

export default MachineProcStatsExecutor;