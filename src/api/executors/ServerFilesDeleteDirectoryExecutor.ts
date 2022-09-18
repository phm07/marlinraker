import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IFileChangeNotification } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

interface IParams {
    path: string;
    force: boolean;
}

class ServerFilesDeleteDirectoryExecutor implements IMethodExecutor<IParams, IFileChangeNotification> {

    public readonly name = "server.files.delete_directory";
    public readonly httpMethod = "delete";
    public readonly httpName = "server.files.directory";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IFileChangeNotification> {
        if (!params.path) throw new Error("Invalid path");
        return await marlinRaker.fileManager.deleteDirectory(params.path, params.force ?? false);
    }
}

export default ServerFilesDeleteDirectoryExecutor;