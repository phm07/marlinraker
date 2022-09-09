import { INotification } from "./INotification";

class SimpleNotification implements INotification<unknown[]> {

    public readonly jsonrpc = "2.0";
    public readonly method: string;
    public readonly params?: unknown[];

    public constructor(method: string, params?: unknown[]) {
        this.method = method;
        this.params = params;
    }

    public async toString(): Promise<string> {
        return JSON.stringify(this);
    }
}

export default SimpleNotification;