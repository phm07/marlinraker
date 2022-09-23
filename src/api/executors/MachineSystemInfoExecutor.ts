import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IMachineInfo } from "../../system/SystemInfo";
import { marlinRaker } from "../../Server";

class MachineSystemInfoExecutor implements IMethodExecutor<undefined, IMachineInfo> {

    public readonly name = "machine.system_info";

    public invoke(_: TSender, __: undefined): IMachineInfo {
        return marlinRaker.systemInfo.machineInfo;
    }
}

export default MachineSystemInfoExecutor;