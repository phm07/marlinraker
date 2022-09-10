import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { config, logger, marlinRaker } from "../../Server";
import { TPrinterState } from "../../printer/Printer";
import { Level } from "../../logger/Logger";
import packageJson from "../../../package.json";

type TResult = {
    klippy_connected: boolean,
    klippy_state: TPrinterState,
    components: string[],
    failed_components: string[],
    registered_directories: string[],
    warnings: string[],
    websocket_count: number,
    moonraker_version: string,
    api_version: number[],
    api_version_string: string;
};

class ServerInfoExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "server.info";

    public invoke(_: TSender, __: undefined): TResult {

        const warnings = config.warnings.slice();

        if (logger.level > Level.info) {
            warnings.push("\"extended_logs\" is enabled. Only use this option for debugging purposes.");
        }

        return {
            klippy_connected: true,
            klippy_state: marlinRaker.printer?.state ?? "error",
            components: [
                "server",
                "file_manager",
                "machine",
                "database",
                "data_store",
                "job_queue",
                "announcements",
                "update_manager"
            ],
            failed_components: [],
            registered_directories: ["gcodes", "config"],
            warnings,
            websocket_count: marlinRaker.connectionManager.connections.length,
            moonraker_version: packageJson.version,
            api_version: packageJson.version.split(".")
                .map((s) => Number.parseInt(s))
                .filter((n) => !Number.isNaN(n)),
            api_version_string: packageJson.version
        };
    }
}

export default ServerInfoExecutor;
