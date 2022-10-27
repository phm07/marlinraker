import WebSocket from "ws";

interface IConnection {
    connectionId: number;
    socket: WebSocket;
    clientName: string;
    version: string;
    type: string;
    url: string;
}

class ConnectionManager {

    public connections: IConnection[];

    public constructor() {
        this.connections = [];
    }

    public registerConnection(socket: WebSocket, clientName: string, version: string, type: string, url: string): IConnection {
        const connection: IConnection = {
            connectionId: this.findConnectionId(),
            socket,
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

    public findConnectionById(connectionId: number): IConnection | null {
        return this.connections.find((connection) => connection.connectionId === connectionId) ?? null;
    }

    private findConnectionId(): number {
        let connectionId: number;
        do {
            connectionId = 1e9 + Math.floor(Math.random() * (9e9 - 1));
        } while (this.connections.some((connection) => connection.connectionId === connectionId));
        return connectionId;
    }
}

export { IConnection };
export default ConnectionManager;