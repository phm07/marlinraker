import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { WebSocket } from "ws";
import MarlinRaker from "../../MarlinRaker";
import { IPrinterObjects } from "../../printer/objects/ObjectManager";

interface IParams {
    [key: string]: unknown;
    objects: Record<string, string[] | null>;
    connection_id: number;
}

class PrinterObjectsSubscribeExecutor implements IMethodExecutor<IParams, IPrinterObjects> {

    public readonly name = "printer.objects.subscribe";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(sender: TSender, params: Partial<IParams>): IPrinterObjects {

        let socket: WebSocket | undefined;
        if (sender instanceof WebSocket) {
            socket = sender;
        } else if (params.connection_id) {
            socket = this.marlinRaker.connectionManager.findConnectionById(params.connection_id)?.socket;
        }
        if (!socket) {
            throw new Error("Cannot identify socket");
        }

        let objects: Record<string, string[] | null> = {};
        if (params.objects) {
            objects = params.objects;
        } else {
            for (const key in params) {
                const topics = String(params[key]).split(",");
                objects[key] = topics.length > 0 ? topics : null;
            }
        }

        return this.marlinRaker.objectManager.subscribe(socket, objects);
    }
}

export default PrinterObjectsSubscribeExecutor;