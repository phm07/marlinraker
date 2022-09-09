import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

type TParams = { namespace: string, key: string | null };
type TResult = { namespace: string, key: string | null, value: unknown };

class ServerDatabaseGetItemExecutor implements IMethodExecutor<TParams, TResult> {

    public readonly name = "server.database.get_item";
    public readonly httpName = "server.database.item";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TResult> {
        if (!params.namespace) throw "Invalid namespace";
        return {
            namespace: params.namespace,
            key: params.key ?? null,
            value: await marlinRaker.database.getItem(params.namespace, params.key ?? undefined)
        };
    }

}

export default ServerDatabaseGetItemExecutor;