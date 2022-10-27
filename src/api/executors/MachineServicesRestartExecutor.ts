import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    service: string;
}

class MachineServicesRestartExecutor implements IMethodExecutor<IParams, string> {

    public readonly name = "machine.services.restart";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, params: Partial<IParams>): string {
        if (!params.service || !this.marlinRaker.systemInfo.serviceManager.activeServiceList.includes(params.service)) {
            throw new Error("Service not active");
        }
        setTimeout(() => void this.marlinRaker.systemInfo.serviceManager.systemctl("restart", params.service!));
        return "ok";
    }
}

export default MachineServicesRestartExecutor;