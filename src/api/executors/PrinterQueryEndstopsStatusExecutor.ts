import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TResult = Record<string, string>;

class PrinterQueryEndstopsStatusExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "printer.query_endstops.status";

    public async invoke(_: TSender, __: Partial<undefined>): Promise<TResult> {
        return await marlinRaker.printer?.queryEndstops() ?? {};
    }
}

export default PrinterQueryEndstopsStatusExecutor;