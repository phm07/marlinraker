import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class PrinterPrintPauseExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.print.pause";

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await marlinRaker.printer?.dispatchCommand("pause");
        return "ok";
    }
}

export default PrinterPrintPauseExecutor;