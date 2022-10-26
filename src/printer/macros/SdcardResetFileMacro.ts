import { IMacro } from "./IMacro";
import MarlinRaker from "../../MarlinRaker";

class SdcardResetFileMacro implements IMacro {

    public readonly name = "sdcard_reset_file";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async execute(_: Record<string, string>): Promise<void> {
        await this.marlinRaker.jobManager.reset();
    }
}

export default SdcardResetFileMacro;