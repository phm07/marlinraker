import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    namespace: string;
    key: string;
    value: unknown;
}

interface IResult {
    namespace: string;
    key: string | null;
    value: unknown;
}

class ServerDatabasePostItemExecutor implements IMethodExecutor<IParams, IResult> {

    public readonly name = "server.database.post_item";
    public readonly httpName = "server.database.item";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IResult> {
        if (!params.namespace) throw new Error("Invalid namespace");
        if (!params.key) throw new Error("Invalid key");
        return {
            namespace: params.namespace,
            key: params.key,
            value: await this.marlinRaker.database.addItem(params.namespace, params.key, params.value)
        };
    }
}

export default ServerDatabasePostItemExecutor;