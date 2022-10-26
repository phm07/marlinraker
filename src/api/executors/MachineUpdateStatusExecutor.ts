import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IUpdateStatus } from "../../update/UpdateManager";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    refresh: boolean;
}

class MachineUpdateStatusExecutor implements IMethodExecutor<IParams, IUpdateStatus> {

    public readonly name = "machine.update.status";
    public readonly timeout = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IUpdateStatus> {
        if (params.refresh) {
            await this.marlinRaker.updateManager.checkForUpdates();
        }
        return this.marlinRaker.updateManager.getUpdateStatus();
    }
}

export default MachineUpdateStatusExecutor;