import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class PrinterFirmwareRestartExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.firmware_restart";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await this.marlinRaker.reconnect();
        return "ok";
    }
}

export default PrinterFirmwareRestartExecutor;