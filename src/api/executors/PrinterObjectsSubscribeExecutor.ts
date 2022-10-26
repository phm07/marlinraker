import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { WebSocket } from "ws";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    objects: Record<string, string[] | null>;
}

interface IResult {
    eventtime: number;
    status: Record<string, unknown>;
}

class PrinterObjectsSubscribeExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "printer.objects.subscribe";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(sender: TSender, params: Partial<IParams>): IResult | null {
        if (!params.objects) throw new Error("Invalid objects");
        if (!(sender instanceof WebSocket)) return null;
        return this.marlinRaker.printer?.objectManager.subscribe(sender, params.objects) ?? null;
    }
}

export default PrinterObjectsSubscribeExecutor;