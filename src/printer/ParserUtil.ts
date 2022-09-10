type THeater = {
    temp?: number;
    target?: number;
    power?: number
};

type THeaters = Record<string, THeater>;

type TPrinterInfo = {
    machineType: string;
    firmwareName: string;
};

type TPrinterCapabilities = Record<string, boolean | undefined>;

type TFileInfo = {
    filename: string;
    fullName?: string;
    size?: number;
};

class ParserUtil {
    public static parseM115Response(response: string): [TPrinterInfo, TPrinterCapabilities] {
        // "FIRMWARE_NAME:Marlin 1.1.0 (Github) SOURCE_CODE_URL:https://github.com/MarlinFirmware/Marlin PROTOCOL_VERSION:1.0 MACHINE_TYPE:RepRap EXTRUDER_COUNT:1 UUID:cede2a2f-41a2-4748-9b12-c55c62f367ff"
        const line = response.split("\n").find((s) => s.startsWith("FIRMWARE_NAME:"));
        if (!line) throw "Could not parse printer information";
        const firmwareName = line.substring(14, line.indexOf("SOURCE_CODE_URL:") - 1);
        const machineType = line.substring(line.indexOf("MACHINE_TYPE:") + 13, line.indexOf("EXTRUDER_COUNT") - 1);
        const info = { firmwareName, machineType };
        const capabilities = Object.fromEntries(
            // "Cap:EEPROM:0"
            response.split("\n")
                .filter((s) => s.startsWith("Cap:"))
                .map((s) => s.substring(4).split(":"))
                .map(([key, value]) => [key, value === "1"])
        );
        return [info, capabilities];
    }

    // " T:229.00 /230.00 B:84.96 /85.00 A:48.33 /0.00 @:55 B@:58"
    public static parseM105Response(line: string): THeaters {
        const heaters: THeaters = {};
        const parts = line.trim().split(" ");
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.indexOf("@:") !== -1) {
                const [id, powerStr] = part.split("@:");
                (heaters[id || "T"] ??= {}).power = Math.round(Number.parseInt(powerStr) / 127 * 100) / 100;
            } else if (part.indexOf(":") !== -1) {
                const [id, tempStr] = part.split(":");
                if (id === "W") continue;
                try {
                    (heaters[id] ??= {}).temp = Number.parseFloat(tempStr);
                    heaters[id].target = Number.parseFloat(parts[++i]?.substring(1));
                } catch (e) {
                    //
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
    public static parseM114Response(line: string): [number, number, number, number] {
        return (line.trim().split(" ")
            .map((s) => s.substring(2))
            .slice(0, 4)
            .map((s) => Number.parseFloat(s))) as [number, number, number, number];
    }

    public static parseM20Response(line: string): Record<string, TFileInfo | undefined> {

        const files: Record<string, TFileInfo | undefined> = {};

        for (const fileInfo of line.split("\n").slice(1, -2)) {
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
        return Object.fromEntries(response.split("\n")
            .filter((s) => s.indexOf(":") !== -1)
            .map((s) => s.split(":")
                .map((t) => t.trim())
            ));
    }
}

export { THeater, THeaters, TPrinterInfo, TPrinterCapabilities, TFileInfo };
export default ParserUtil;