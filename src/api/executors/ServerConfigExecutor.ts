import { IMethodExecutor, TSender } from "./IMethodExecutor";

type TResult = unknown;

class ServerConfigExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "server.config";

    public invoke(_: TSender, __: undefined): Promise<TResult> | TResult {
        // @TODO
        return {};
    }
}

export default ServerConfigExecutor;