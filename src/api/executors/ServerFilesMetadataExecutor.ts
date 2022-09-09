import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { TGcodeMetadata } from "../../files/MetadataManager";
import { marlinRaker } from "../../Server";

type TParams = {
    filename: string;
};

class ServerFilesMetadataExecutor implements IMethodExecutor<TParams, TGcodeMetadata | null> {

    public readonly name = "server.files.metadata";

    public async invoke(_: TSender, params: Partial<TParams>): Promise<TGcodeMetadata | null> {
        if (!params.filename) throw "Invalid filename";
        return await marlinRaker.metadataManager.getOrGenerateMetadata(params.filename);
    }
}

export default ServerFilesMetadataExecutor;