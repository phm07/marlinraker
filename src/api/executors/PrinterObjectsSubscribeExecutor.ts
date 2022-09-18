import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import { WebSocket } from "ws";

interface IParams {
    objects: Record<string, string[] | null>;
}

interface IResult {
    eventtime: number;
    status: Record<string, unknown>;
}

class PrinterObjectsSubscribeExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "printer.objects.subscribe";

    public invoke(sender: TSender, params: Partial<IParams>): IResult | null {
        if (!params.objects) throw new Error("Invalid objects");
        if (!(sender instanceof WebSocket)) return null;
        return marlinRaker.printer?.objectManager.subscribe(sender, params.objects) ?? null;
    }
}

export default PrinterObjectsSubscribeExecutor;