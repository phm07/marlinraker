import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    filename: string;
}

class PrinterPrintStartExecutor implements IMethodExecutor<IParams, string> {

    public readonly name = "printer.print.start";
    public readonly httpMethod = "post";
    public readonly timeout = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<string> {
        if (this.marlinRaker.state !== "ready") throw new Error("Printer not ready");
        if (!params.filename) throw new Error("Invalid filename");
        if (await this.marlinRaker.jobManager.selectFile(`gcodes/${params.filename}`)) {
            await this.marlinRaker.dispatchCommand("start_print", false);
            return "ok";
        } else {
            throw new Error("Could not start print");
        }
    }
}

export default PrinterPrintStartExecutor;