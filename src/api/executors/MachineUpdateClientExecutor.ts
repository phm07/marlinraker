import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TParams = {
    name: string;
};

class MachineUpdateClientExecutor implements IMethodExecutor<TParams, string> {

    public readonly name = "machine.update.client";
    public readonly timeout = null;

    public async invoke(_: TSender, params: Partial<TParams>): Promise<string> {
        if (!params.name) throw "Invalid name";
        await marlinRaker.updateManager.update(params.name);
        return "ok";
    }
}

export default MachineUpdateClientExecutor;