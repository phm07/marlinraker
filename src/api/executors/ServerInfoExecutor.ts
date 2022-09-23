import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { config, logger, marlinRaker } from "../../Server";
import { TPrinterState } from "../../printer/Printer";
import { Level } from "../../logger/Logger";
import packageJson from "../../../package.json";

interface IResult {
    klippy_connected: boolean;
    klippy_state: TPrinterState;
    components: string[];
    failed_components: string[];
    registered_directories: string[];
    warnings: string[];
    websocket_count: number;
    moonraker_version: string;
    api_version: number[];
    api_version_string: string;
    type: string;
}

class ServerInfoExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "server.info";
    private readonly versionArray: number[];

    public constructor() {
        this.versionArray = packageJson.version
            .replace(/[^0-9.]/g, "")
            .split(".")
            .map((s) => Number.parseInt(s))
            .filter((n) => !Number.isNaN(n));
    }

    public invoke(_: TSender, __: undefined): IResult {
        const warnings = config.warnings.slice();
        if (logger.level > Level.info) {
            warnings.push("\"extended_logs\" is enabled. Only use this option for debugging purposes. This option can affect print performance.");
        }
        const components = [
            "server",
            "file_manager",
            "machine",
            "database",
            "data_store",
            "proc_stats"
        ];
        if (Object.keys(marlinRaker.updateManager.updatables).length) {
            components.push("update_manager");
        }

        return {
            klippy_connected: true,
            klippy_state: marlinRaker.printer?.state ?? "error",
            components,
            failed_components: [],
            registered_directories: ["gcodes", "config"],
            warnings,
            websocket_count: marlinRaker.connectionManager.connections.length,
            moonraker_version: packageJson.version,
            api_version: this.versionArray,
            api_version_string: packageJson.version,
            type: "marlinraker"
        };
    }
}

export default ServerInfoExecutor;
