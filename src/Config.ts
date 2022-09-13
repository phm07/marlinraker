import fs from "fs-extra";
import path from "path";
import { logger } from "./Server";

class Config {

    public klipperPseudoConfig: unknown;
    private readonly cache: Record<string, unknown | undefined>;
    private readonly config: unknown;
    private readonly configFile: string;

    public constructor(configFile: string) {
        this.cache = {};
        this.configFile = path.resolve(configFile);
        this.config = this.load();
        this.klipperPseudoConfig = this.generateKlipperConfig();
        logger.info(`Config:\n${JSON.stringify(this.config, null, 2)}`);
        logger.info(`Klipper pseudo config:\n${JSON.stringify(this.klipperPseudoConfig, null, 2)}`);
    }

    private load(): unknown {
        let content;
        try {
            content = fs.readFileSync(this.configFile).toString("utf-8");
        } catch (e) {
            logger.error(`Cannot find ${this.configFile}`);
        }
        if (content) {
            try {
                return JSON.parse(content);
            } catch (e) {
                logger.error(`Malformed config (${this.configFile})`);
                logger.error((e as Error).message);
            }
        }
        return {};
    }

    private async save(): Promise<void> {
        try {
            const content = JSON.stringify(this.config, null, 2);
            await fs.writeFile(this.configFile, content, { encoding: "utf-8" });
        } catch (e) {
            logger.error(e);
        }
    }

    public getOrDefault<T>(property: string, defaultValue: T): T {
        if (this.cache[property] !== undefined) {
            return this.cache[property] as T;
        }
        let value = this.config;
        for (const next of property.split(".")) {
            value = (value as Record<string, unknown> | undefined)?.[next];
        }
        if (value === undefined) {
            logger.warn(`Warning: "${property}" does not exist in ${this.configFile}`);
            if (defaultValue !== null) {
                logger.warn(`Using default value ${JSON.stringify(defaultValue)} for property ${property}`);

                const parts = property.split(".");
                const name = parts.pop()!;
                let parent = this.config as Record<string, unknown>;
                for (const next of parts) {
                    parent[next] ??= {};
                    parent = parent[next] as Record<string, unknown>;
                }
                (parent as Record<string, unknown>)[name] = defaultValue;
                void this.save();
            }
            value = defaultValue;
        }
        this.cache[property] = value;
        return value as T;
    }

    private generateKlipperConfig(): unknown {
        const klipperConfig = {
            extruder: {
                min_temp: this.getOrDefault("printer.extruder.min_temp", 0),
                max_temp: this.getOrDefault("printer.extruder.max_temp", 250),
                min_extrude_temp: this.getOrDefault("printer.extruder.min_extrude_temp", 180)
            },
            heater_bed: {
                min_temp: this.getOrDefault("printer.heater_bed.min_temp", 0),
                max_temp: this.getOrDefault("printer.heater_bed.max_temp", 60)
            },
            bed_mesh: {
                mesh_min: "0, 0",
                mesh_max: this.getOrDefault("printer.print_volume.x", 0) + ","
                    + this.getOrDefault("printer.print_volume.y", 0)
            },
            virtual_sdcard: {},
            pause_resume: {},
            display_status: {}
        };
        const override = (this.config as Record<string, unknown>).klipper_pseudo_config;
        if (override === Object(override)) { // check if is object
            Object.assign(klipperConfig, override);
        }
        return klipperConfig;
    }
}

export default Config;