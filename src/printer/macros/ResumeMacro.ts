import { IMacro } from "./IMacro";
import { marlinRaker } from "../../Server";

class ResumeMacro implements IMacro {

    public readonly name = "resume";

    public async execute(_: Record<string, string>): Promise<void> {
        await marlinRaker.jobManager.resume();
    }
}

export default ResumeMacro;