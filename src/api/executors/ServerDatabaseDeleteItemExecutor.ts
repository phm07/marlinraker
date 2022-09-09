import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TParams = { namespace: string, key: string };
type TResult = { namespace: string, key: string | null, value: unknown };

class ServerDatabaseDeleteItemExecutor implements IMethodExecutor<TParams, TResult> {

    public readonly name = "server.database.delete_item";
    public readonly httpName = "server.database.item";
    public readonly httpMethod = "delete";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TResult> {
        if (!params.namespace) throw "Invalid namespace";
        if (!params.key) throw "Invalid key";
        const value = await marlinRaker.database.deleteItem(params.namespace, params.key);
        return {
            namespace: params.namespace,
            key: params.key,
            value
        };
    }
}

export default ServerDatabaseDeleteItemExecutor;