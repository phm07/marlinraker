import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TTempRecords } from "../../printer/HeaterManager";
import MarlinRaker from "../../MarlinRaker";

class ServerTemperatureStoreExecutor implements IMethodExecutor<undefined, TTempRecords> {

    public readonly name = "server.temperature_store";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): TTempRecords {
        return this.marlinRaker.printer?.heaterManager.records ?? {};
    }
}

export default ServerTemperatureStoreExecutor;