import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TParams = {
    filename: string;
};

class PrinterPrintStartExecutor implements IMethodExecutor<TParams, string> {

    public readonly name = "printer.print.start";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<string> {
        if (!params.filename) throw "Invalid filename";
        await marlinRaker.jobManager.startPrintJob("gcodes/" + params.filename);
        return "ok";
    }
}

export default PrinterPrintStartExecutor;