import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TFileInfo } from "../../files/FileManager";
import { marlinRaker } from "../../Server";

type TParams = {
    root: "gcodes" | "config";
};

class ServerFilesListExecutor implements IMethodExecutor<TParams, TFileInfo[]> {

    public readonly name = "server.files.list";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TFileInfo[]> {
        return await marlinRaker.fileManager.listFiles(params.root ?? "gcodes");
    }

}

export default ServerFilesListExecutor;