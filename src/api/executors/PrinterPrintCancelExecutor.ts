import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class PrinterPrintCancelExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.print.cancel";
    public readonly timeout = null;

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await marlinRaker.dispatchCommand("cancel_print", false);
        return "ok";
    }
}

export default PrinterPrintCancelExecutor;