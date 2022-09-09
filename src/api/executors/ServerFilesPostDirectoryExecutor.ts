import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TFileChangeNotification } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

type TParams = {
    path: string;
};

class ServerFilesPostDirectoryExecutor implements IMethodExecutor<TParams, TFileChangeNotification> {

    public readonly name = "server.files.post_directory";
    public readonly httpMethod = "post";
    public readonly httpName = "server.files.directory";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TFileChangeNotification> {
        if (!params.path) throw "Invalid path";
        return await marlinRaker.fileManager.createDirectory(params.path);
    }
}

export default ServerFilesPostDirectoryExecutor;