import { IMacro } from "./IMacro";
import PauseMacro from "./PauseMacro";
import ResumeMacro from "./ResumeMacro";
import CancelPrintMacro from "./CancelPrintMacro";
import CustomMacro from "./CustomMacro";
import { config, logger } from "../../Server";
import NamedObjectMap from "../../util/NamedObjectMap";
import StartPrintMacro from "./StartPrintMacro";
import SdcardResetFileMacro from "./SdcardResetFileMacro";
import MarlinRaker from "../../MarlinRaker";

class MacroManager {

    public readonly macros;

    public constructor(marlinRaker: MarlinRaker) {
        this.macros = new NamedObjectMap<IMacro>([
            new PauseMacro(marlinRaker),
            new ResumeMacro(marlinRaker),
            new CancelPrintMacro(marlinRaker),
            new StartPrintMacro(marlinRaker),
            new SdcardResetFileMacro(marlinRaker)
        ]);
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
                        .map((arr) => [arr[0].toLowerCase(), arr[1] ?? true])
                );
                await macro?.execute(params);
                return true;
            }
        }

        return false;
    }

    private loadMacros(): void {

        const f = (strings: string[], ...expressions: unknown[]): string => {
            let result = strings[0] ?? "";
            for (let i = 0; i < expressions.length; i++) {
                const expr = expressions[i];
                if (typeof expr !== "undefined" && expr !== null && expr !== false) result += expr;
                result += strings[i + 1] ?? "";
            }
            return result;
        };

        const macros = config.getObject("macros", {});
        for (const configName in macros) {
            const macroName = configName.toLowerCase();

            if (!/^[a-z_]+$/.test(macroName)) {
                logger.error(`Macro name "${macroName}" is invalid and will not be loaded`);
                continue;
            }

            const renameExisting = config.getStringIfExists(`macros.${configName}.rename_existing`, null)?.toLowerCase()
                ?? `${macroName}_base`;
            if (this.macros[macroName] && this.macros[renameExisting]) {
                logger.error(`Cannot rename "${macroName}" to "${renameExisting}": Macro already exists`);
            }

            const gcode = config.getString(`macros.${configName}.gcode`, "");
            if (new RegExp(`^\\s*${macroName.replace(/(?=\W)/g, "\\")}(\\s|$)`, "gmi").test(gcode)) {
                logger.error(`Error in macro ${macroName}: Cannot call self`);
                continue;
            }

            try {
                const evaluate = new Function("f", "args", "printer", `"use strict";return f\`${gcode}\`;`);
                const existing = this.macros[macroName];
                if (existing) {
                    this.macros[renameExisting] = existing;
                }
                this.macros[macroName] = new CustomMacro(macroName, (args, printer) => evaluate(f, args, printer));

                logger.info(`Registered macro "${macroName}"`);
            } catch (e) {
                logger.error(`Error while registering macro "${macroName}":`);
                logger.error(e);
            }
        }

        for (const macroName in this.macros) {
            if (macroName === this.macros[macroName]?.name) {
                (config.klipperPseudoConfig as Record<string, unknown>)[`gcode_macro ${macroName.toUpperCase()}`] = {};
            }
        }
    }
}

export default MacroManager;