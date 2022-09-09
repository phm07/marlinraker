import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TResult = { objects: string[] };

class PrinterObjectsListExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "printer.objects.list";

    public invoke(_: TSender, __: undefined): TResult {
        return {
            objects: Object.keys(marlinRaker.printer?.objectManager.objects ?? {})
        };
    }
}

export default PrinterObjectsListExecutor;