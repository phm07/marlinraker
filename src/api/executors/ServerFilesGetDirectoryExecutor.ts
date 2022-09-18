import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import { IDirInfo } from "../../files/FileManager";

interface IParams {
    path: string;
    extended: boolean;
}

class ServerFilesGetDirectoryExecutor implements IMethodExecutor<IParams, IDirInfo> {

    public readonly name = "server.files.get_directory";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IDirInfo> {
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