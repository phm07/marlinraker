import { TVec4 } from "../util/Utils";

interface IHeater {
    temp?: number;
    target?: number;
    power?: number;
}

type THeaters = Record<string, IHeater>;

interface IPrinterInfo {
    machineType: string;
    firmwareName: string;
}

type TPrinterCapabilities = Record<string, boolean | undefined>;

interface IFileInfo {
    filename: string;
    fullName?: string;
    size?: number;
}

interface IHomedAxes {
    x: boolean;
    y: boolean;
    z: boolean;
}

class ParserUtil {
    public static parseM115Response(response: string): [IPrinterInfo, TPrinterCapabilities] {
        // "FIRMWARE_NAME:Marlin 1.1.0 (Github) SOURCE_CODE_URL:https://github.com/MarlinFirmware/Marlin PROTOCOL_VERSION:1.0 MACHINE_TYPE:RepRap EXTRUDER_COUNT:1 UUID:cede2a2f-41a2-4748-9b12-c55c62f367ff"
        // "FIRMWARE_NAME:Prusa-Firmware 3.10.1 based on Marlin FIRMWARE_URL:https://github.com/prusa3d/Prusa-Firmware PROTOCOL_VERSION:1.0 MACHINE_TYPE:Prusa i3 MK3S EXTRUDER_COUNT:1 UUID:00000000-0000-0000-0000-000000000000"
        const line = response.split(/\r?\n/).find((s) => s.startsWith("FIRMWARE_NAME:"));
        if (!line) throw new Error("Could not parse printer information");
        const firmwareName = /FIRMWARE_NAME:(.*?)( [A-Z_]+:|$)/.exec(line)?.[1] ?? "";
        const machineType = /MACHINE_TYPE:(.*?)( [A-Z_]+:|$)/.exec(line)?.[1] ?? "";
        const info = { firmwareName, machineType };
        const capabilities = Object.fromEntries(
            // "Cap:EEPROM:0"
            response.split(/\r?\n/)
                .filter((s) => s.startsWith("Cap:"))
                .map((s) => s.substring(4).split(":"))
                .map(([key, value]) => [key, value === "1"])
        );
        return [info, capabilities];
    }

    // " T:229.00 /230.00 B:84.96 /85.00 A:48.33 /0.00 @:55 B@:58"
    public static parseM105Response(line: string): THeaters | null {
        const heaters: THeaters = {};
        const parts = line.split(/\r?\n/)
            .map((s) => s.trim())
            .find((s) => s.startsWith("T"))
            ?.split(" ");
        if (!parts) return null;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.includes("@:")) {
                // eslint-disable-next-line prefer-const
                let [id, powerStr] = part.split("@:");
                if (id === "T0") id = "T";
                (heaters[id || "T"] ??= {}).power = Math.round(Number.parseInt(powerStr) / 127 * 100) / 100;
            } else if (part.includes(":")) {
                // eslint-disable-next-line prefer-const
                let [id, tempStr] = part.split(":");
                if (id === "W") continue;
                if (id === "T0") id = "T";
                (heaters[id] ??= {}).temp = Number.parseFloat(tempStr);
                if (parts[i + 1]?.startsWith("/")) {
                    heaters[id].target = Number.parseFloat(parts[i + 1]!.substring(1));
                }
            }
        }
        for (const heater in heaters) {
            if (heaters[heater].power === undefined) {
                delete heaters[heater].target;
            }
        }
        return heaters;
    }

    // X:180.40 Y:-3.00 Z:0.00 E:0.00 Count X:18040 Y:-300 Z:0
    public static parseM114Response(line: string): TVec4 | null {
        return (line
            .split(/\r?\n/)
            .find((s) => s.startsWith("X:"))
            ?.trim()
            .split(" ")
            .map((s) => s.substring(2))
            .slice(0, 4)
            .map((s) => Number.parseFloat(s)) ?? null) as TVec4 | null;
    }

    public static parseM20Response(line: string): Record<string, IFileInfo | undefined> {

        const files: Record<string, IFileInfo | undefined> = {};

        for (const fileInfo of line.split(/\r?\n/).slice(1, -2)) {
            const arr = fileInfo.split(" ");
            const filename = arr[0].substring(0, arr[0].length - 4) + ".gcode";
            const size = Number.parseInt(arr[1]) || 0;
            const fullName = arr.slice(2).join(" ").replaceAll("\\ ", " ") || filename;
            files[filename] = {
                filename,
                size,
                fullName
            };
        }

        return files;
    }

    public static parseG0G1G92Request(line: string): Record<string, number | undefined> {
        return Object.fromEntries(line.trim().split(" ").slice(1)
            .map((s) => [s[0], Number.parseFloat(s.substring(1))]));
    }

    public static parseM119Response(response: string): Record<string, string> {
        return Object.fromEntries(response.split(/\r?\n/)
            .filter((s) => s.includes(":"))
            .map((s) => s.split(":")
                .map((t) => t.trim())
            ));
    }

    public static parseM106Request(line: string): number {
        const result = Number.parseInt(line
            .split(" ")
            .slice(1)
            .find((s) => s.startsWith("S"))
            ?.substring(1) ?? "");
        return Number.isNaN(result) ? 255 : result;
    }

    public static parseM220M221Request(line: string): number | undefined {
        const result = Number.parseInt(line
            .split(" ")
            .slice(1)
            .find((s) => s.startsWith("S"))
            ?.substring(1) ?? "");
        return Number.isNaN(result) ? undefined : result;
    }

    public static parseG28Request(line: string, alreadyHomed: IHomedAxes = {
        x: false,
        y: false,
        z: false
    }): IHomedAxes {
        const params = line.split(" ").slice(1).join();
        const homedAxes: IHomedAxes = { x: false, y: false, z: false };
        const keys = Object.keys(homedAxes) as (keyof IHomedAxes)[];
        keys.forEach((s) => homedAxes[s] = params.includes(s.toUpperCase()));
        if (!Object.values(homedAxes).reduce((a, b) => a || b)) {
            keys.forEach((s) => homedAxes[s] = true);
        }
        keys.forEach((s) => homedAxes[s] ||= alreadyHomed[s]);
        return homedAxes;
    }

    public static isEmergencyCommand(command: string, prusa: boolean): boolean {
        return (prusa ? /^M112(?:\s|$)/ : /^M(?:112|108|410|876)(?:\s|$)/).test(command);
    }

    public static trimGcodeLine(gcode: string): string {
        return gcode.split(";")[0].trim();
    }
}

export { IHeater, THeaters, IPrinterInfo, TPrinterCapabilities, IFileInfo, IHomedAxes };
export default ParserUtil;