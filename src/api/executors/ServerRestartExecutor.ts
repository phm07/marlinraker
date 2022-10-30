import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class ServerRestartExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "server.restart";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): string {
        setTimeout(async () => await this.marlinRaker.restart());
        return "ok";
    }
}

export default ServerRestartExecutor;