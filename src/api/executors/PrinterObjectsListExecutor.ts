import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

interface IResult {
    objects: string[];
}

class PrinterObjectsListExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "printer.objects.list";

    public invoke(_: TSender, __: undefined): IResult {
        return {
            objects: Object.keys(marlinRaker.printer?.objectManager.objects ?? {})
        };
    }
}

export default PrinterObjectsListExecutor;