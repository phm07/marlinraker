import { IMacro } from "./IMacro";
import PauseMacro from "./PauseMacro";
import ResumeMacro from "./ResumeMacro";
import CancelPrintMacro from "./CancelPrintMacro";
import CustomMacro from "./CustomMacro";
import { config, logger } from "../../Server";
import NamedObjectMap from "../../util/NamedObjectMap";

class MacroManager {

    public readonly macros = new NamedObjectMap<IMacro>([
        new PauseMacro(),
        new ResumeMacro(),
        new CancelPrintMacro()
    ]);

    public constructor() {
        this.loadMacros();
    }

    public async execute(command: string): Promise<boolean> {
        const calledMacro = command.trim().split(" ")[0].toLowerCase();
        for (const macroName in this.macros) {
            const macro = this.macros[macroName];
            if (macroName.toLowerCase() === calledMacro) {
                const params = Object.fromEntries(
                    command.substring(macroName.length).trim()
                        .split(" ")
                        .filter((s) => s)
                        .map((s) => s.split("="))
                        .filter((s) => s.length === 2)
                        .map((s) => [s[0].toUpperCase(), s[1]])
                );
                await macro?.execute(params);
                return true;
            }
        }

        return false;
    }

    private loadMacros(): void {
        const macros = config.getObject("macros", {});
        for (const macroName in macros) {
            const renameExisting = config.getStringIfExists(`macros.${macroName}.rename_existing`, null);
            const gcode = config.getString(`macros.${macroName}.gcode`, "");
            if (new RegExp(`^\\s*${macroName.replace(/(?=\W)/g, "\\")}(\\s|$)`, "gmi").test(gcode)) {
                logger.error(`Error in macro ${macroName}: Cannot call self`);
                continue;
            }
            this.registerMacro(macroName, renameExisting ?? macroName + "_base", gcode);
        }
        for (const macroName in this.macros) {
            if (macroName === this.macros[macroName]?.name) {
                (config.klipperPseudoConfig as Record<string, unknown>)[`gcode_macro ${macroName.toLowerCase()}`] = {};
            }
        }
    }

    private registerMacro(name: string, renameExisting: string, gcode: string): void {
        const existing = this.macros[name];
        if (existing) {
            this.macros[renameExisting] = existing;
        }
        this.macros[name] = new CustomMacro(name, gcode);
    }
}

export default MacroManager;