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

        let objects: Record<string, string[] | null> = {};
        if (params.objects) {
            objects = params.objects;
        } else {
            for (const key in params) {
                objects[key] = params[key] ? String(params[key]).split(",") : null;
            }
        }

        if (!Object.keys(objects).length) throw new Error("No objects provided");
        return this.marlinRaker.objectManager.query(objects);
    }
}

export default PrinterObjectsQueryExecutor;