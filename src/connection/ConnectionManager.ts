import { IConnection } from "./IConnection";
import * as crypto from "crypto";
import WebSocket from "ws";

class ConnectionManager {

    public connections: IConnection[];

    public constructor() {
        this.connections = [];
    }

    public registerConnection(socket: WebSocket, clientName: string, version: string, type: string, url: string): IConnection {
        const connection: IConnection = {
            connectionId: this.findConnectionId(),
            clientName,
            version,
            type,
            url
        };
        this.connections.push(connection);
        socket.on("close", () => {
            this.connections = this.connections.filter((c) => c !== connection);
        });
        return connection;
    }

    private findConnectionId(): number {
        let connectionId: number;
        do {
            connectionId = crypto.randomBytes(4).readInt32BE();
        } while (this.connections.some((connection) => connection.connectionId === connectionId));
        return connectionId;
    }
}

export default ConnectionManager;