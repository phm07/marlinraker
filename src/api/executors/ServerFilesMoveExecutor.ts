import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IFileChangeNotification } from "../../files/FileManager";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    source: string;
    dest: string;
}

class ServerFilesMoveExecutor implements IMethodExecutor<IParams, IFileChangeNotification> {

    public readonly name = "server.files.move";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IFileChangeNotification> {
        if (!params.source) throw new Error("Invalid source");
        if (!params.dest) throw new Error("Invalid destination");
        return await this.marlinRaker.fileManager.moveOrCopy(params.source, params.dest, false);
    }
}

export default ServerFilesMoveExecutor;