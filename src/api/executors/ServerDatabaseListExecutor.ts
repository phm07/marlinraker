import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TResult = {
    namespaces: string[]
};

class ServerDatabaseListExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "server.database.list";

    public async invoke(_: TSender, __: undefined): Promise<TResult> {
        return {
            namespaces: await marlinRaker.database.getNamespaces()
        };
    }
}

export default ServerDatabaseListExecutor;