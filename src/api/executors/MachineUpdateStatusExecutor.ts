import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IUpdateStatus } from "../../update/UpdateManager";
import { marlinRaker } from "../../Server";

interface IParams {
    refresh: boolean;
}

class MachineUpdateStatusExecutor implements IMethodExecutor<IParams, IUpdateStatus> {

    public readonly name = "machine.update.status";
    public readonly timeout = null;

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IUpdateStatus> {
        if (params.refresh) {
            await marlinRaker.updateManager.checkForUpdates();
        }
        return marlinRaker.updateManager.getUpdateStatus();
    }
}

export default MachineUpdateStatusExecutor;