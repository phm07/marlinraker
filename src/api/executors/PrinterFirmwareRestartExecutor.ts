import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class PrinterFirmwareRestartExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.firmware_restart";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): string {
        setTimeout(async () => await this.marlinRaker.reconnect());
        return "ok";
    }
}

export default PrinterFirmwareRestartExecutor;