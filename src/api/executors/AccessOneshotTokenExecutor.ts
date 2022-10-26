import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { Socket } from "net";
import MarlinRaker from "../../MarlinRaker";

class AccessOneshotTokenExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "access.oneshot_token";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(sender: TSender, _: undefined): string | null {
        if (!(sender instanceof Socket)) return null;
        return this.marlinRaker.accessManager.generateOneshotToken(sender);
    }
}

export default AccessOneshotTokenExecutor;