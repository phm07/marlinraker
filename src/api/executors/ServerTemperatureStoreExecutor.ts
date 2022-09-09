import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TTempRecords } from "../../printer/HeaterManager";
import { marlinRaker } from "../../Server";

class ServerTemperatureStoreExecutor implements IMethodExecutor<undefined, TTempRecords> {

    public readonly name = "server.temperature_store";

    public invoke(_: TSender, __: undefined): TTempRecords {
        return marlinRaker.printer?.heaterManager.records ?? {};
    }
}

export default ServerTemperatureStoreExecutor;