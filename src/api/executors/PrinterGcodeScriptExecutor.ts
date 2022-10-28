import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    script: string;
}

class PrinterGcodeScriptExecutor implements IMethodExecutor<IParams, string> {

    public readonly name = "printer.gcode.script";
    public readonly httpMethod = "post";
    public readonly timeout = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<string> {
        if (this.marlinRaker.state !== "ready") throw new Error("Printer not ready");
        await this.marlinRaker.dispatchCommand(params.script ?? "");
        return "ok";
    }
}

export default PrinterGcodeScriptExecutor;