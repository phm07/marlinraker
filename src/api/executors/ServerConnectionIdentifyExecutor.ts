import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import WebSocket from "ws";

interface IParams {
    client_name: string;
    version: string;
    type: string;
    url: string;
}

interface IResult {
    connection_id: number;
}

class ServerConnectionIdentifyExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.connection.identify";
    public readonly httpMethod = null;

    public invoke(sender: TSender, params: Partial<IParams>): IResult | null {
        if (!params.client_name || !params.version || !params.type || !params.url) throw new Error("Incomplete params");
        if (!(sender instanceof WebSocket)) return null;
        const connection = marlinRaker.connectionManager.registerConnection(sender, params.client_name, params.version, params.type, params.url);
        return { connection_id: connection.connectionId };
    }
}

export default ServerConnectionIdentifyExecutor;