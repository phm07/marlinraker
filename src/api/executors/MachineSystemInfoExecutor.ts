import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IMachineInfo } from "../../system/SystemInfo";
import MarlinRaker from "../../MarlinRaker";

class MachineSystemInfoExecutor implements IMethodExecutor<undefined, IMachineInfo> {

    public readonly name = "machine.system_info";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): IMachineInfo {
        return this.marlinRaker.systemInfo.machineInfo;
    }
}

export default MachineSystemInfoExecutor;