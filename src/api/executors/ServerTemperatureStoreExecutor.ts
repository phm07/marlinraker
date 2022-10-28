import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";
import { ITempRecord } from "../../printer/HeaterManager";

type TResult = Record<string, ITempRecord>;

class ServerTemperatureStoreExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "server.temperature_store";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): TResult {
        if (this.marlinRaker.state !== "ready") throw new Error("Printer not ready");
        return Object.fromEntries(this.marlinRaker.printer?.heaterManager.records ?? []);
    }
}

export default ServerTemperatureStoreExecutor;