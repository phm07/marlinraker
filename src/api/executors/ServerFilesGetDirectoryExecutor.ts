import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import { TDirInfo } from "../../files/FileManager";

type TParams = {
    path: string,
    extended: boolean
};

class ServerFilesGetDirectoryExecutor implements IMethodExecutor<TParams, TDirInfo> {

    public readonly name = "server.files.get_directory";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TDirInfo> {
        return await marlinRaker.fileManager.getDirectoryInfo(params.path ?? "gcodes") ?? {
            dirs: [],
            files: [],
            disk_usage: {
                total: 0,
                used: 0,
                free: 0
            },
            root_info: {
                name: params.path ?? "gcodes",
                permissions: "r"
            }
        };
    }
}

export default ServerFilesGetDirectoryExecutor;