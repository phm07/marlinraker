import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    service: string;
}

class MachineServicesStartExecutor implements IMethodExecutor<IParams, string> {

    public readonly name = "machine.services.start";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, params: Partial<IParams>): string {
        if (!params.service || !this.marlinRaker.systemInfo.serviceManager.activeServiceList.includes(params.service)) {
            throw new Error("Service not active");
        }
        if (params.service === "marlinraker") throw new Error("Cannot start Marlinraker service");
        setTimeout(() => void this.marlinRaker.systemInfo.serviceManager.systemctl("start", params.service!));
        return "ok";
    }
}

export default MachineServicesStartExecutor;