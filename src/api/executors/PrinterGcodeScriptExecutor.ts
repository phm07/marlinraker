import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TParams = { script: string };

class PrinterGcodeScriptExecutor implements IMethodExecutor<TParams, string> {

    public readonly name = "printer.gcode.script";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<string> {
        await marlinRaker.printer?.dispatchCommand(params.script ?? "");
        return "ok";
    }
}

export default PrinterGcodeScriptExecutor;