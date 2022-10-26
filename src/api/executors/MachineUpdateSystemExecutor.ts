import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class MachineUpdateSystemExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "machine.update.system";
    public readonly httpMethod = "post";
    public readonly timeout = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await this.marlinRaker.updateManager.update("system");
        return "ok";
    }
}

export default MachineUpdateSystemExecutor;