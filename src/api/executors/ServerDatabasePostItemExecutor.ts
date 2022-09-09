import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TParams = { namespace: string, key: string, value: unknown };
type TResult = { namespace: string, key: string | null, value: unknown };

class ServerDatabasePostItemExecutor implements IMethodExecutor<TParams, TResult> {

    public readonly name = "server.database.post_item";
    public readonly httpName = "server.database.item";
    public readonly httpMethod = "post";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TResult> {
        if (!params.namespace) throw "Invalid namespace";
        if (!params.key) throw "Invalid key";
        return {
            namespace: params.namespace,
            key: params.key,
            value: await marlinRaker.database.addItem(params.namespace, params.key, params.value)
        };
    }
}

export default ServerDatabasePostItemExecutor;