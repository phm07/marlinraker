import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IMachineInfo } from "../../system/SystemInfo";
import MarlinRaker from "../../MarlinRaker";
import { IActiveService } from "../../system/ServiceManager";

interface IResult {
    system_info: IMachineInfo & {
        available_services: string[];
        service_state: Record<string, IActiveService>;
    };
}

class MachineSystemInfoExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "machine.system_info";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): IResult {
        return {
            system_info: {
                ...this.marlinRaker.systemInfo.machineInfo,
                available_services: this.marlinRaker.systemInfo.serviceManager.activeServiceList,
                service_state: this.marlinRaker.systemInfo.serviceManager.activeServices
            }
        };
    }
}

export default MachineSystemInfoExecutor;