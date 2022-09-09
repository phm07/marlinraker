import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class PrinterRestartExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.restart";

    public async invoke(_: TSender, __: undefined): Promise<string> {
        marlinRaker.restart();
        return "ok";
    }
}

export default PrinterRestartExecutor;