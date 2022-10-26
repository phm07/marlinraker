import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class PrinterPrintCancelExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.print.cancel";
    public readonly timeout = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await this.marlinRaker.dispatchCommand("cancel_print", false);
        return "ok";
    }
}

export default PrinterPrintCancelExecutor;