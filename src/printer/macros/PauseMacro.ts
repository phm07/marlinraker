import { IMacro } from "./IMacro";
import MarlinRaker from "../../MarlinRaker";

class PauseMacro implements IMacro {

    public readonly name = "pause";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async execute(_: Record<string, string>): Promise<void> {
        await this.marlinRaker.jobManager.pause();
    }
}

export default PauseMacro;