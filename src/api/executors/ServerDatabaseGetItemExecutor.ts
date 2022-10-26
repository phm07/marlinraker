import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

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
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IResult> {
        if (!params.namespace) throw new Error("Invalid namespace");
        const value = await this.marlinRaker.database.getItem(params.namespace, params.key ?? undefined);
        if (value === null) throw new Error(`${params.namespace}${params.key ? `.${params.key}` : ""} doesn't exist`);
        return {
            namespace: params.namespace,
            key: params.key ?? null,
            value
        };
    }

}

export default ServerDatabaseGetItemExecutor;