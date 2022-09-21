import { IMacro } from "./IMacro";
import { marlinRaker } from "../../Server";

class SdcardResetFileMacro implements IMacro {

    public readonly name = "sdcard_reset_file";

    public async execute(_: Record<string, string>): Promise<void> {
        await marlinRaker.jobManager.reset();
    }
}

export default SdcardResetFileMacro;