import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class PrinterPrintResumeExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.print.resume";
    public readonly timeout = null;

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await marlinRaker.printer?.dispatchCommand("resume", false);
        return "ok";
    }
}

export default PrinterPrintResumeExecutor;