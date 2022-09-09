import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { config, logger, marlinRaker } from "../../Server";
import { TPrinterState } from "../../printer/Printer";
import { Level } from "../../logger/Logger";

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
            moonraker_version: "1.0.0",
            api_version: [1, 0, 0],
            api_version_string: "1.0.0"
        };
    }
}

export default ServerInfoExecutor;
