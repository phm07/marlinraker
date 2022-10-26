import { IMethodExecutor, TSender } from "./IMethodExecutor";
import WebSocket from "ws";
import MarlinRaker from "../../MarlinRaker";

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
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(sender: TSender, params: Partial<IParams>): IResult | null {
        if (!params.client_name || !params.version || !params.type || !params.url) throw new Error("Incomplete params");
        if (!(sender instanceof WebSocket)) return null;
        const connection = this.marlinRaker.connectionManager.registerConnection(sender, params.client_name, params.version, params.type, params.url);
        return { connection_id: connection.connectionId };
    }
}

export default ServerConnectionIdentifyExecutor;