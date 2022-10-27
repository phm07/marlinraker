import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";
import { IPrinterObjects } from "../../printer/objects/ObjectManager";

interface IParams {
    [key: string]: unknown;
    objects: Record<string, string[] | null>;
}

class PrinterObjectsQueryExecutor implements IMethodExecutor<IParams, IPrinterObjects> {

    public readonly name = "printer.objects.query";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, params: Partial<IParams>): IPrinterObjects {
        if (!this.marlinRaker.printer) throw new Error("Printer is offline");

        let objects: Record<string, string[] | null> = {};
        if (params.objects) {
            objects = params.objects;
        } else {
            for (const key in params) {
                const topics = String(params[key]).split(",");
                objects[key] = topics.length > 0 ? topics : null;
            }
        }

        if (!Object.keys(objects).length) throw new Error("No objects provided");
        return this.marlinRaker.printer.objectManager.query(objects);
    }
}

export default PrinterObjectsQueryExecutor;