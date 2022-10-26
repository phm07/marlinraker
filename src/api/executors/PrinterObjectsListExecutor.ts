import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IResult {
    objects: string[];
}

class PrinterObjectsListExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "printer.objects.list";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): IResult {
        return {
            objects: Object.keys(this.marlinRaker.printer?.objectManager.objects ?? {})
        };
    }
}

export default PrinterObjectsListExecutor;