import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

interface IResult {
    namespaces: string[];
}

class ServerDatabaseListExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.database.list";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<IResult> {
        return {
            namespaces: await this.marlinRaker.database.getNamespaces()
        };
    }
}

export default ServerDatabaseListExecutor;