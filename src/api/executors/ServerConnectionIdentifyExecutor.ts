import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import WebSocket from "ws";

type TParams = { client_name: string, version: string, type: string, url: string };
type TResult = { connection_id: number };

class ServerConnectionIdentifyExecutor implements IMethodExecutor<TParams, TResult> {

    public readonly name = "server.connection.identify";
    public readonly httpMethod = null;

    public invoke(sender: TSender, params: Partial<TParams>): TResult | null {
        if (!params.client_name || !params.version || !params.type || !params.url) throw "Incomplete params";
        if (!(sender instanceof WebSocket)) return null;
        const connection = marlinRaker.connectionManager.registerConnection(sender, params.client_name, params.version, params.type, params.url);
        return { connection_id: connection.connectionId };
    }
}

export default ServerConnectionIdentifyExecutor;