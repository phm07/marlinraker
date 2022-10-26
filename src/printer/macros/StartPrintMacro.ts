import { IMacro } from "./IMacro";
import MarlinRaker from "../../MarlinRaker";

class StartPrintMacro implements IMacro {

    public readonly name = "start_print";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async execute(_: Record<string, string>): Promise<void> {
        await this.marlinRaker.jobManager.start();
    }
}

export default StartPrintMacro;