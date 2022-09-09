interface INotification<TParams> {
    jsonrpc: "2.0";
    method: string;
    params?: TParams;
    toString: () => Promise<string>;
}

export { INotification };