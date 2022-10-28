import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IFileInfo } from "../../files/FileManager";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    root: "gcodes" | "config";
}

class ServerFilesListExecutor implements IMethodExecutor<IParams, IFileInfo[]> {

    public readonly name = "server.files.list";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IFileInfo[]> {
        return await this.marlinRaker.fileManager.listFiles(params.root ?? "gcodes");
    }
}

export default ServerFilesListExecutor;