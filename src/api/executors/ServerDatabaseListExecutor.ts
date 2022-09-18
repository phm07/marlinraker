import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

interface IResult {
    namespaces: string[];
}

class ServerDatabaseListExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.database.list";

    public async invoke(_: TSender, __: undefined): Promise<IResult> {
        return {
            namespaces: await marlinRaker.database.getNamespaces()
        };
    }
}

export default ServerDatabaseListExecutor;