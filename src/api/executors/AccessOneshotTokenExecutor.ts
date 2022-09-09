import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";
import { Socket } from "net";

class AccessOneshotTokenExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "access.oneshot_token";

    public invoke(sender: TSender, _: undefined): string | null {
        if (!(sender instanceof Socket)) return null;
        return marlinRaker.accessManager.generateOneshotToken(sender);
    }
}

export default AccessOneshotTokenExecutor;