import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IDirInfo } from "../../files/FileManager";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    path: string;
    extended: boolean;
}

class ServerFilesGetDirectoryExecutor implements IMethodExecutor<IParams, IDirInfo> {

    public readonly name = "server.files.get_directory";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IDirInfo> {
        return await this.marlinRaker.fileManager.getDirectoryInfo(params.path ?? "gcodes") ?? {
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