import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

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
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IResult> {
        if (!params.namespace) throw new Error("Invalid namespace");
        if (!params.key) throw new Error("Invalid key");
        const value = await this.marlinRaker.database.deleteItem(params.namespace, params.key);
        return {
            namespace: params.namespace,
            key: params.key,
            value
        };
    }
}

export default ServerDatabaseDeleteItemExecutor;