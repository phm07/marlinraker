import { IMacro } from "./IMacro";
import { marlinRaker } from "../../Server";

class PauseMacro implements IMacro {

    public readonly name = "pause";

    public async execute(_: Record<string, string>): Promise<void> {
        await marlinRaker.jobManager.pause();
    }
}

export default PauseMacro;