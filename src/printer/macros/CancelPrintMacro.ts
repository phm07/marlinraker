import { IMacro } from "./IMacro";
import { marlinRaker } from "../../Server";

class CancelPrintMacro implements IMacro {

    public readonly name = "cancel_print";

    public async execute(_: Record<string, string>): Promise<void> {
        await marlinRaker.jobManager.cancel();
    }
}

export default CancelPrintMacro;