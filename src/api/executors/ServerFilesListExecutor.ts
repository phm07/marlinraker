import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IFileInfo } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

interface IParams {
    root: "gcodes" | "config";
}

class ServerFilesListExecutor implements IMethodExecutor<IParams, IFileInfo[]> {

    public readonly name = "server.files.list";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IFileInfo[]> {
        return await marlinRaker.fileManager.listFiles(params.root ?? "gcodes");
    }

}

export default ServerFilesListExecutor;