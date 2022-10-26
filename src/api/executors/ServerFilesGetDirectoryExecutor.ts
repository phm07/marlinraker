import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IDirInfo } from "../../files/FileManager";
import MarlinRaker from "../../MarlinRaker";
import { rootDir } from "../../Server";
import path from "path";

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
        const dirname = params.path ?? "gcodes";
        return await this.marlinRaker.fileManager.getDirectoryInfo(dirname) ?? {
            dirs: [],
            files: [],
            disk_usage: await this.marlinRaker.fileManager.getDiskUsage(path.join(rootDir, dirname)),
            root_info: {
                name: dirname,
                permissions: "r"
            }
        };
    }
}

export default ServerFilesGetDirectoryExecutor;