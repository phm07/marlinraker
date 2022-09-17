import fs from "fs-extra";
import path from "path";
import { logger } from "./Server";

class Config {

    public klipperPseudoConfig: unknown;
    private readonly cache: Record<string, unknown | undefined>;
    private readonly config: unknown;
    private readonly configFile: string;
    private isConfigMalformed: boolean;

    public constructor(configFile: string) {
        this.cache = {};
        this.configFile = path.resolve(configFile);
        this.isConfigMalformed = false;
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
                this.isConfigMalformed = false;
                return JSON.parse(content);
            } catch (e) {
                if (!this.isConfigMalformed) {
                    logger.error(`Malformed config (${this.configFile})`);
                    logger.error((e as Error).message);
                }
                this.isConfigMalformed = true;
            }
        }
        return {};
    }

    private async saveProperty(property: string, value: unknown): Promise<void> {

        let content, config: Record<string, unknown>;
        try {
            content = fs.readFileSync(this.configFile).toString("utf-8");
        } catch (e) {
            logger.error(`Cannot find ${this.configFile}`);
        }

        if (!content) return;

        try {
            config = JSON.parse(content);
            this.isConfigMalformed = false;
        } catch (e) {
            if (!this.isConfigMalformed) {
                logger.error(`Malformed config (${this.configFile})`);
                logger.error((e as Error).message);
            }
            this.isConfigMalformed = true;
            return;
        }

        const parts = property.split(".");
        const name = parts.pop()!;
        let parent = config;
        for (const next of parts) {
            parent[next] ??= {};
            parent = parent[next] as Record<string, unknown>;
        }

        (parent as Record<string, unknown>)[name] = value;
        await fs.writeFile(this.configFile, JSON.stringify(config, null, 2), { encoding: "utf-8" });
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
            logger.warn(`Warning: "${property}" was not found in ${this.configFile}`);
            if (defaultValue !== null) {
                logger.warn(`Using default value ${JSON.stringify(defaultValue)} for property ${property}`);
                void this.saveProperty(property, defaultValue);
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