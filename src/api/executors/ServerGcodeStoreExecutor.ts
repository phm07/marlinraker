import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TGcodeLog } from "../../printer/SerialGcodeDevice";
import { marlinRaker } from "../../Server";

type TParams = { count: number };
type TResult = { gcode_store: TGcodeLog[] };

class ServerGcodeStoreExecutor implements IMethodExecutor<TParams, TResult> {

    public readonly name = "server.gcode_store";

    public invoke(_: TSender, params: Partial<TParams>): TResult {
        return {
            gcode_store: marlinRaker.printer?.gcodeStore.slice(-Math.min(params.count ?? Infinity, 1000)) ?? []
        };
    }
}

export default ServerGcodeStoreExecutor;