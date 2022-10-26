import { IMacro } from "./IMacro";
import MarlinRaker from "../../MarlinRaker";

class ResumeMacro implements IMacro {

    public readonly name = "resume";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async execute(_: Record<string, string>): Promise<void> {
        await this.marlinRaker.jobManager.resume();
    }
}

export default ResumeMacro;