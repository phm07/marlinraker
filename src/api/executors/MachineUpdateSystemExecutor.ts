import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class MachineUpdateSystemExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "machine.update.system";

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await marlinRaker.updateManager.update("system");
        return "ok";
    }
}

export default MachineUpdateSystemExecutor;