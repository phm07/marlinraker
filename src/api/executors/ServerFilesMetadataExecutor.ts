import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IGcodeMetadata } from "../../files/MetadataManager";
import { marlinRaker } from "../../Server";

interface IParams {
    filename: string;
}

class ServerFilesMetadataExecutor implements IMethodExecutor<IParams, IGcodeMetadata | null> {

    public readonly name = "server.files.metadata";

    public async invoke(_: TSender, params: Partial<IParams>): Promise<IGcodeMetadata | null> {
        if (!params.filename) throw new Error("Invalid filename");
        return await marlinRaker.metadataManager.getOrGenerateMetadata(params.filename);
    }
}

export default ServerFilesMetadataExecutor;