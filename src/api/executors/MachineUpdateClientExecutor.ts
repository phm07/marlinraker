import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    name: string;
}

class MachineUpdateClientExecutor implements IMethodExecutor<IParams, string> {

    public readonly name = "machine.update.client";
    public readonly timeout = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<string> {
        if (!params.name) throw new Error("Invalid name");
        await this.marlinRaker.updateManager.update(params.name);
        return "ok";
    }
}

export default MachineUpdateClientExecutor;