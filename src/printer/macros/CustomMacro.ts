import { IMacro } from "./IMacro";
import { marlinRaker } from "../../Server";

class CustomMacro implements IMacro {

    public readonly name: string;
    public readonly gcode: string;

    public constructor(name: string, gcode: string) {
        this.name = name;
        this.gcode = gcode;
    }

    public async execute(_: Record<string, string>): Promise<void> {
        await marlinRaker.printer?.dispatchCommand(this.gcode, false);
    }
}

export default CustomMacro;