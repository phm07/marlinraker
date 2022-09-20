import { marlinRaker } from "../Server";

class KlipperCompat {

    public static translateCommand(klipperCommand: string): (() => Promise<void>) | null {

        if (/^SET_HEATER_TEMPERATURE(\s|$)/i.test(klipperCommand)) {
            const args = klipperCommand.split(" ").slice(1);

            const heaterName = args.find((s) => s.toUpperCase().startsWith("HEATER="))?.substring(7);
            if (!heaterName) {
                throw new Error("missing HEATER");
            }
            const marlinHeater = Object.entries(marlinRaker.printer?.heaterManager.klipperHeaterNames ?? [])
                .find(([_, value]) => value === heaterName)?.[0];
            if (!marlinHeater) {
                throw new Error(`The value '${heaterName}' is not valid for HEATER`);
            }

            const targetStr = args.find((s) => s.toUpperCase().startsWith("TARGET="))?.substring(7);
            if (!targetStr) {
                throw new Error("missing TARGET");
            }
            let target: number;
            try {
                target = Number.parseFloat(targetStr);
            } catch (e) {
                throw new Error(`unable to parse ${targetStr}`);
            }

            if (marlinHeater.startsWith("T")) {
                return async () => {
                    const param = marlinHeater + (marlinHeater.length === 1 ? "0" : "");
                    await marlinRaker.printer?.queueGcode(`M104 ${param} S${target}`, false, false);
                };
            } else if (marlinHeater === "B") {
                return async () => {
                    await marlinRaker.printer?.queueGcode(`M140 S${target}`, false, false);
                };
            } else {
                throw new Error("Internal error");
            }

        } else if (/^BED_MESH_CALIBRATE(\s|$)/i.test(klipperCommand)) {

            /*
            Klipper doesn't do anything with the profile name so I won't too
            const profileName = klipperCommand.split(" ")
                .find(s => s.toUpperCase().startsWith("PROFILE="))
                ?.substring(8) ?? "default";
             */
            return async () => {
                const response = await marlinRaker.printer?.queueGcode("G29 V4", false, false);
                if (!response) return;

                // Bed X: >???< Y: >???< Z: ???
                const [minX, minY, maxX, maxY] = response.split(/\r?\n/)
                    .filter((s) => s.startsWith("Bed"))
                    .map((s) => s.split(" ")
                        .filter((_, i) => i === 2 || i === 4)
                        .map((f) => Number.parseFloat(f))
                    )
                    .map((arr) => [arr[0], arr[1], arr[0], arr[1]])
                    .reduce((a, b) => [
                        Math.min(a[0], b[0]), Math.min(a[1], b[1]),
                        Math.max(a[2], b[2]), Math.max(a[3], b[3])
                    ]);

                const grid: number[][] = [];
                response.split(/\r?\n/)
                    .filter((s) => s.startsWith(" "))
                    .map((s) => s.trim().split(" "))
                    .map((arr) => arr.map((s) => Number.parseFloat(s)))
                    .forEach((arr) => grid[arr[0]] = arr.slice(1));

                const mean = grid.flat().reduce((a, b) => a + b) / grid.flat().length;
                grid.forEach((arr) => arr.forEach((_, i) => arr[i] = Math.round((arr[i] - mean) * 100) / 100));

                marlinRaker.printer?.emit("updateBedMesh", {
                    grid,
                    min: [minX, minY],
                    max: [maxX, maxY],
                    profile: "default"
                });
            };

        } else if (/^RESTART(\s|$)/i.test(klipperCommand)) {
            return async () => {
                marlinRaker.restart();
            };

        } else if (/^FIRMWARE_RESTART(\s|$)/i.test(klipperCommand)) {
            return async () => {
                await marlinRaker.printer?.restart();
            };

        } else if (/^SDCARD_RESET_FILE(\s|$)/i.test(klipperCommand)) {
            return async () => {
                marlinRaker.jobManager.reset();
            };
        }

        return null;
    }
}

export default KlipperCompat;