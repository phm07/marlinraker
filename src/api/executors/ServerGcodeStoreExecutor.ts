import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import { IGcodeLog } from "../../MarlinRaker";

interface IParams {
    count: number;
}

interface IResult {
    gcode_store: IGcodeLog[];
}

class ServerGcodeStoreExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.gcode_store";

    public invoke(_: TSender, params: Partial<IParams>): IResult {
        return {
            gcode_store: marlinRaker.gcodeStore.slice(-Math.min(params.count ?? Infinity, 1000))
        };
    }
}

export default ServerGcodeStoreExecutor;