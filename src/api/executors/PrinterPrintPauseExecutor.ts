import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class PrinterPrintPauseExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.print.pause";
    public readonly httpMethod = "post";
    public readonly timeout = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<string> {
        if (this.marlinRaker.state !== "ready") throw new Error("Printer not ready");
        await this.marlinRaker.dispatchCommand("pause", false);
        return "ok";
    }
}

export default PrinterPrintPauseExecutor;