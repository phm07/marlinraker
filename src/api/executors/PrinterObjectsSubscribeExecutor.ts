import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import { WebSocket } from "ws";

type TParams = { objects: Record<string, string[] | null> };
type TResult = { eventtime: number, status: Record<string, unknown> };

class PrinterObjectsSubscribeExecutor implements IMethodExecutor<TParams, TResult> {

    public readonly name = "printer.objects.subscribe";

    public invoke(sender: TSender, params: Partial<TParams>): TResult | null {
        if (!params.objects) throw "Invalid objects";
        if (!(sender instanceof WebSocket)) return null;
        return marlinRaker.printer?.objectManager.subscribe(sender, params.objects) ?? null;
    }
}

export default PrinterObjectsSubscribeExecutor;