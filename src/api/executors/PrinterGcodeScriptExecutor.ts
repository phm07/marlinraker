import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

interface IParams {
    script: string;
}

class PrinterGcodeScriptExecutor implements IMethodExecutor<IParams, string> {

    public readonly name = "printer.gcode.script";
    public readonly timeout = null;

    public async invoke(_: TSender, params: Partial<IParams>): Promise<string> {
        await marlinRaker.printer?.dispatchCommand(params.script ?? "");
        return "ok";
    }
}

export default PrinterGcodeScriptExecutor;