import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TUpdateStatus } from "../../update/UpdateManager";
import { marlinRaker } from "../../Server";

type TParams = {
    refresh: boolean;
};

class MachineUpdateStatusExecutor implements IMethodExecutor<TParams, TUpdateStatus> {

    public readonly name = "machine.update.status";
    public readonly timeout = null;

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TUpdateStatus> {
        if (params.refresh) {
            await marlinRaker.updateManager.checkForUpdates();
        }
        return marlinRaker.updateManager.getUpdateStatus();
    }
}

export default MachineUpdateStatusExecutor;