import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TFileChangeNotification } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

type TParams = {
    path: string;
    force: boolean;
};

class ServerFilesDeleteDirectoryExecutor implements IMethodExecutor<TParams, TFileChangeNotification> {

    public readonly name = "server.files.delete_directory";
    public readonly httpMethod = "delete";
    public readonly httpName = "server.files.directory";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TFileChangeNotification> {
        if (!params.path) throw "Invalid path";
        return await marlinRaker.fileManager.deleteDirectory(params.path, params.force ?? false);
    }
}

export default ServerFilesDeleteDirectoryExecutor;