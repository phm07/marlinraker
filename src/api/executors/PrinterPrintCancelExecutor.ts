import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class PrinterPrintCancelExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.print.cancel";
    public readonly timeout = null;

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await marlinRaker.printer?.dispatchCommand("cancel_print");
        return "ok";
    }
}

export default PrinterPrintCancelExecutor;