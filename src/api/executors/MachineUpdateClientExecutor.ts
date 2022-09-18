import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

interface IParams {
    name: string;
}

class MachineUpdateClientExecutor implements IMethodExecutor<IParams, string> {

    public readonly name = "machine.update.client";
    public readonly timeout = null;

    public async invoke(_: TSender, params: Partial<IParams>): Promise<string> {
        if (!params.name) throw new Error("Invalid name");
        await marlinRaker.updateManager.update(params.name);
        return "ok";
    }
}

export default MachineUpdateClientExecutor;