import { IMacro } from "./IMacro";
import MarlinRaker from "../../MarlinRaker";

class CancelPrintMacro implements IMacro {

    public readonly name = "cancel_print";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async execute(_: Record<string, string>): Promise<void> {
        await this.marlinRaker.jobManager.cancel();
    }
}

export default CancelPrintMacro;