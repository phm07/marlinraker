import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TFileChangeNotification } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

type TParams = {
    path: string
};

class ServerFilesDeleteFileExecutor implements IMethodExecutor<TParams, TFileChangeNotification> {

    public readonly name = "server.files.delete_file";
    public readonly httpMethod = null;

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TFileChangeNotification> {
        if (!params.path) throw "Invalid path";
        return await marlinRaker.fileManager.deleteFile(params.path);
    }
}

export default ServerFilesDeleteFileExecutor;