import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

type TResult = Record<string, string>;

class PrinterQueryEndstopsStatusExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "printer.query_endstops.status";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: Partial<undefined>): Promise<TResult> {
        return await this.marlinRaker.printer?.queryEndstops() ?? {};
    }
}

export default PrinterQueryEndstopsStatusExecutor;