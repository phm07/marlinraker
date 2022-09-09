import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TFileChangeNotification } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

type TParams = {
    source: string,
    dest: string
};

class ServerFilesCopyExecutor implements IMethodExecutor<TParams, TFileChangeNotification> {

    public readonly name = "server.files.copy";
    public readonly httpMethod = "post";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TFileChangeNotification> {
        if (!params.source) throw "Invalid source";
        if (!params.dest) throw "Invalid destination";
        return await marlinRaker.fileManager.moveOrCopy(params.source, params.dest, true);
    }
}

export default ServerFilesCopyExecutor;