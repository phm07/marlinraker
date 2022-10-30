import fs from "fs-extra";
import path from "path";
import { logger } from "../Server";
import TOML from "@iarna/toml";
import Utils, { TVec3 } from "../util/Utils";

interface IFileInfo {
    filename: string;
    sections: string[];
}

class Config {

    public klipperPseudoConfig: object;
    public readonly config: unknown;
    public readonly files: IFileInfo[];
    public readonly warnings: string[];
    private readonly cache: Record<string, unknown | undefined>;
    private readonly configFile: string;
    private readonly isConfigMalformed: boolean;

    public constructor(configFile: string) {
        this.warnings = [];
        this.cache = {};
        this.configFile = path.resolve(configFile);
        this.isConfigMalformed = false;
        [this.config, this.files] = this.load();
        this.klipperPseudoConfig = this.generateKlipperConfig();
        logger.info("Config loaded");
        logger.debug(`Config:\n${JSON.stringify(this.config, null, 2)}`);
        logger.debug(`Klipper pseudo config:\n${JSON.stringify(this.klipperPseudoConfig, null, 2)}`);
    }

    private resolve(filepath: string, resolvedSoFar: string[] = []): [object, IFileInfo[]] {

        if (!fs.pathExistsSync(filepath)) {
            throw new Error(`${filepath} does not exist`);
        }

        const originalContent = fs.readFileSync(filepath).toString("utf-8");
        const resolvedContent = TOML.parse(originalContent.replace("\\", "\\\\"));
        resolvedSoFar.push(filepath);

        const fileInfo = [{
            filename: path.relative(path.dirname(this.configFile), filepath),
            sections: Utils.getDeepKeys(resolvedContent)
        }];

        const regex = /^#<include +([\w\-. /\\]+?)>.*$/gmi;
        let match;
        while ((match = regex.exec(originalContent)) !== null) {
            const file = match[1];
            const target = path.resolve(path.dirname(filepath), file);

            if (resolvedSoFar.some((resolved) => !path.relative(resolved, target))) {
                throw new Error(`Cyclic reference to ${path.basename(target)}`);
            }

            try {
                const [resolvedImport, importFileInfo] = this.resolve(target, resolvedSoFar);
                Object.assign(resolvedContent, resolvedImport);
                fileInfo.push(...importFileInfo);
            } catch (e) {
                const lineNum = originalContent.substring(0, match.index).split(/\r?\n/).length;
                logger.error(`Cannot resolve import ${path.basename(target)} in ${path.basename(filepath)}, line ${lineNum}: ${Utils.errorToString(e)}`);
            }
        }

        return [resolvedContent, fileInfo];
    }

    private load(): [unknown, IFileInfo[]] {
        try {
            return this.resolve(this.configFile);
        } catch (e) {
            logger.error("Loading config failed:");
            logger.error(e);
        }
        return [{}, []];
    }

    public getObject(property: string, defaultValue: object): object {
        return this.getGeneric<object>(property, defaultValue, (x): x is object => typeof x === "object");
    }

    public getString(property: string, defaultValue: string): string {
        return this.getGeneric<string>(property, defaultValue, (x): x is string => typeof x === "string");
    }

    public getStringIfExists(property: string, defaultValue: string | null): string | null {
        return this.getGeneric<string | null>(property, defaultValue, (x): x is string | null => typeof x === "undefined" || typeof x === "string") ?? null;
    }

    public getNumber(property: string, defaultValue: number): number {
        return this.getGeneric<number>(property, defaultValue, (x): x is number => typeof x === "number");
    }

    public getNumberIfExists(property: string, defaultValue: number | null): number | null {
        return this.getGeneric<number | null>(property, defaultValue, (x): x is number | null => typeof x === "undefined" || typeof x === "number") ?? null;
    }

    public getStringOrNumber(property: string, defaultValue: string | number): string | number {
        return this.getGeneric(property, defaultValue, (x): x is string | number => typeof x === "string" || typeof x === "number");
    }

    public getBoolean(property: string, defaultValue: boolean): boolean {
        return this.getGeneric<boolean>(property, defaultValue, (x): x is boolean => typeof x === "boolean");
    }

    public getStringArray(property: string, defaultValue: string[]): string[] {
        return this.getGeneric<string[]>(property, defaultValue, (x): x is string[] => Array.isArray(x) && x.every((el) => typeof el === "string"));
    }

    public getGeneric<T>(property: string, defaultValue: T, check: (x: unknown) => x is T): T {
        if (this.cache[property] !== undefined) {
            return this.cache[property] as T;
        }
        let value = this.config;
        for (const next of property.split(".")) {
            value = (value as Record<string, unknown> | undefined)?.[next];
        }
        if (value === undefined && defaultValue !== null) {
            logger.warn(`Warning: "${property}" was not found in ${this.configFile}`);
            logger.warn(`Using default value ${JSON.stringify(defaultValue)} for property ${property}`);
            this.warnings.push(`Property "${property}" is missing. Using default value ${JSON.stringify(defaultValue)}.`);
            value = defaultValue;
        } else if (!check(value)) {
            logger.warn(`Warning: "${property}" is of wrong type (${typeof value})`);
            if (defaultValue !== null) {
                logger.warn(`Using default value ${JSON.stringify(defaultValue)} for property ${property}`);
                this.warnings.push(`Property "${property}" is of wrong type (${typeof value}). Using default value ${JSON.stringify(defaultValue)} instead.`);
            } else {
                this.warnings.push(`Property "${property}" is of wrong type (${typeof value}).`);
            }
            value = defaultValue;
        }
        this.cache[property] = value;
        return value as T;
    }

    private generateKlipperConfig(): object {
        const printVolume = this.getGeneric<TVec3>("printer.print_volume",
            [220, 220, 240], (x): x is TVec3 =>
                typeof x === "object" && Array.isArray(x) && x.length === 3
        );
        const klipperConfig = {
            extruder: {
                min_temp: this.getNumber("printer.extruder.min_temp", 0),
                max_temp: this.getNumber("printer.extruder.max_temp", 250),
                min_extrude_temp: this.getNumber("printer.extruder.min_extrude_temp", 180)
            },
            heater_bed: {
                min_temp: this.getNumber("printer.heater_bed.min_temp", 0),
                max_temp: this.getNumber("printer.heater_bed.max_temp", 60)
            },
            bed_mesh: {
                mesh_min: "0, 0",
                mesh_max: `${printVolume[0]}, ${printVolume[1]}`
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

export { IFileInfo };
export default Config;