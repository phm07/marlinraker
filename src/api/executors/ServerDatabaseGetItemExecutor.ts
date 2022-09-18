import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

interface IParams {
    namespace: string;
    key: string | null;
}

interface IResult {
    namespace: string;
    key: string | null;
    value: unknown;
}

class ServerDatabaseGetItemExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.database.get_item";
    public readonly httpName = "server.database.item";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IResult> {
        if (!params.namespace) throw new Error("Invalid namespace");
        const value = await marlinRaker.database.getItem(params.namespace, params.key ?? undefined);
        if (value === null) throw new Error(`${params.namespace}${params.key ? `.${params.key}` : ""} doesn't exist`);
        return {
            namespace: params.namespace,
            key: params.key ?? null,
            value
        };
    }

}

export default ServerDatabaseGetItemExecutor;