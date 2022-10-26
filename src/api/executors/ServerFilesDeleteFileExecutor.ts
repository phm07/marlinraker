import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IFileChangeNotification } from "../../files/FileManager";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    path: string;
}

class ServerFilesDeleteFileExecutor implements IMethodExecutor<IParams, IFileChangeNotification> {

    public readonly name = "server.files.delete_file";
    public readonly httpMethod = null;
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IFileChangeNotification> {
        if (!params.path) throw new Error("Invalid path");
        return await this.marlinRaker.fileManager.deleteFile(params.path);
    }
}

export default ServerFilesDeleteFileExecutor;