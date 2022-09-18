import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IFileChangeNotification } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

interface IParams {
    path: string;
}

class ServerFilesPostDirectoryExecutor implements IMethodExecutor<IParams, IFileChangeNotification> {

    public readonly name = "server.files.post_directory";
    public readonly httpMethod = "post";
    public readonly httpName = "server.files.directory";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IFileChangeNotification> {
        if (!params.path) throw new Error("Invalid path");
        return await marlinRaker.fileManager.createDirectory(params.path);
    }
}

export default ServerFilesPostDirectoryExecutor;