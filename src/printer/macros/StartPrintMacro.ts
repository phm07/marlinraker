import { IMacro } from "./IMacro";
import { marlinRaker } from "../../Server";

class StartPrintMacro implements IMacro {

    public readonly name = "start_print";

    public async execute(_: Record<string, string>): Promise<void> {
        await marlinRaker.jobManager.start();
    }
}

export default StartPrintMacro;