import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { IFileInfo } from "../../config/Config";
import { config } from "../../Server";

interface TResult {
    config: unknown;
    orig: unknown;
    files: IFileInfo[];
}

class ServerConfigExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "server.config";

    public invoke(_: TSender, __: undefined): TResult {
        return {
            config: config.config,
            orig: config.config,
            files: config.files
        };
    }
}

export default ServerConfigExecutor;