import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

interface IParams {
    namespace: string;
    key: string;
}

interface IResult {
    namespace: string;
    key: string | null;
    value: unknown;
}

class ServerDatabaseDeleteItemExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.database.delete_item";
    public readonly httpName = "server.database.item";
    public readonly httpMethod = "delete";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IResult> {
        if (!params.namespace) throw new Error("Invalid namespace");
        if (!params.key) throw new Error("Invalid key");
        const value = await marlinRaker.database.deleteItem(params.namespace, params.key);
        return {
            namespace: params.namespace,
            key: params.key,
            value
        };
    }
}

export default ServerDatabaseDeleteItemExecutor;