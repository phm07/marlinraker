import WebSocket from "ws";
import { Socket } from "net";

type TSender = WebSocket | Socket;

interface IMethodExecutor<TParams, TResult> {
    readonly name: string;
    readonly httpMethod?: null | "get" | "post" | "delete";
    readonly httpName?: string;
    readonly timeout?: null | number;
    invoke: (sender: TSender, params: Partial<TParams>) => TResult | Promise<TResult> | string | null;
}

export { TSender, IMethodExecutor };