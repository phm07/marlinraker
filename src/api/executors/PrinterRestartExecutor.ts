import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class PrinterRestartExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.restart";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await this.marlinRaker.restart();
        return "ok";
    }
}

export default PrinterRestartExecutor;