interface IConnection {
    connectionId: number;
    clientName: string;
    version: string;
    type: string;
    url: string;
}

export { IConnection };