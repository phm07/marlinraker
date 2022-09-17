import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class MachineUpdateFullExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "machine.update.full";
    public readonly timeout = null;

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await marlinRaker.updateManager.fullUpdate();
        return "ok";
    }
}

export default MachineUpdateFullExecutor;