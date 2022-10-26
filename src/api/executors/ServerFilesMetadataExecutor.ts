import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IGcodeMetadata } from "../../files/MetadataManager";
import MarlinRaker from "../../MarlinRaker";

interface IParams {
    filename: string;
}

class ServerFilesMetadataExecutor implements IMethodExecutor<IParams, IGcodeMetadata | null> {

    public readonly name = "server.files.metadata";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IGcodeMetadata | null> {
        if (!params.filename) throw new Error("Invalid filename");
        return await this.marlinRaker.metadataManager.getOrGenerateMetadata(params.filename);
    }
}

export default ServerFilesMetadataExecutor;