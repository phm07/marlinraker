import express from "express";
import PrinterInfoExecutor from "./executors/PrinterInfoExecutor";
import ServerInfoExecutor from "./executors/ServerInfoExecutor";
import MachineSystemInfoExecutor from "./executors/MachineSystemInfoExecutor";
import ServerConfigExecutor from "./executors/ServerConfigExecutor";
import ServerDatabaseListExecutor from "./executors/ServerDatabaseListExecutor";
import MessageHandler from "./MessageHandler";
import { IMethodExecutor } from "./executors/IMethodExecutor";
import PrinterObjectsListExecutor from "./executors/PrinterObjectsListExecutor";
import PrinterRestartExecutor from "./executors/PrinterRestartExecutor";
import ServerTemperatureStoreExecutor from "./executors/ServerTemperatureStoreExecutor";
import MachineProcStatsExecutor from "./executors/MachineProcStatsExecutor";
import ServerDatabaseGetItemExecutor from "./executors/ServerDatabaseGetItemExecutor";
import AccessOneshotTokenExecutor from "./executors/AccessOneshotTokenExecutor";
import ServerGcodeStoreExecutor from "./executors/ServerGcodeStoreExecutor";
import PrinterEmergencyStopExecutor from "./executors/PrinterEmergencyStopExecutor";
import ServerJobQueueStatus from "./executors/ServerJobQueueStatus";
import ServerAnnouncementsListExecutor from "./executors/ServerAnnouncementsListExecutor";
import ServerFilesListExecutor from "./executors/ServerFilesListExecutor";
import ServerFilesGetDirectoryExecutor from "./executors/ServerFilesGetDirectoryExecutor";
import ServerFilesMetadataExecutor from "./executors/ServerFilesMetadataExecutor";
import PrinterPrintStartExecutor from "./executors/PrinterPrintStartExecutor";
import PrinterPrintPauseExecutor from "./executors/PrinterPrintPauseExecutor";
import PrinterPrintResumeExecutor from "./executors/PrinterPrintResumeExecutor";
import PrinterPrintCancelExecutor from "./executors/PrinterPrintCancelExecutor";
import FileHandler from "./http/FileHandler";
import { config, router } from "../Server";
import OctoprintEmulator from "./OctoprintEmulator";
import ServerFilesPostDirectoryExecutor from "./executors/ServerFilesPostDirectoryExecutor";
import ServerFilesDeleteDirectoryExecutor from "./executors/ServerFilesDeleteDirectoryExecutor";
import ServerFilesMoveExecutor from "./executors/ServerFilesMoveExecutor";
import ServerFilesCopyExecutor from "./executors/ServerFilesCopyExecutor";
import PrinterFirmwareRestartExecutor from "./executors/PrinterFirmwareRestartExecutor";
import ServerDatabaseDeleteItemExecutor from "./executors/ServerDatabaseDeleteItemExecutor";
import NamedObjectMap from "../util/NamedObjectMap";
import MachineUpdateStatusExecutor from "./executors/MachineUpdateStatusExecutor";
import MachineUpdateClientExecutor from "./executors/MachineUpdateClientExecutor";
import MachineUpdateSystemExecutor from "./executors/MachineUpdateSystemExecutor";
import PrinterQueryEndstopsStatusExecutor from "./executors/PrinterQueryEndstopsStatusExecutor";
import MachineUpdateFullExecutor from "./executors/MachineUpdateFullExecutor";
import ServerDatabasePostItemExecutor from "./executors/ServerDatabasePostItemExecutor";

class HttpHandler extends MessageHandler {

    public readonly fileHandler: FileHandler;
    private readonly methodExecutors = new NamedObjectMap<IMethodExecutor<unknown, unknown>>(
        [
            new AccessOneshotTokenExecutor(),
            new MachineProcStatsExecutor(),
            new MachineSystemInfoExecutor(),
            new MachineUpdateClientExecutor(),
            new MachineUpdateFullExecutor(),
            new MachineUpdateStatusExecutor(),
            new MachineUpdateSystemExecutor(),
            new PrinterEmergencyStopExecutor(),
            new PrinterFirmwareRestartExecutor(),
            new PrinterInfoExecutor(),
            new PrinterObjectsListExecutor(),
            new PrinterPrintCancelExecutor(),
            new PrinterPrintPauseExecutor(),
            new PrinterPrintResumeExecutor(),
            new PrinterPrintStartExecutor(),
            new PrinterQueryEndstopsStatusExecutor(),
            new PrinterRestartExecutor(),
            new ServerAnnouncementsListExecutor(),
            new ServerConfigExecutor(),
            new ServerDatabaseDeleteItemExecutor(),
            new ServerDatabaseGetItemExecutor(),
            new ServerDatabaseListExecutor(),
            new ServerDatabasePostItemExecutor(),
            new ServerFilesCopyExecutor(),
            new ServerFilesDeleteDirectoryExecutor(),
            new ServerFilesGetDirectoryExecutor(),
            new ServerFilesListExecutor(),
            new ServerFilesMetadataExecutor(),
            new ServerFilesMoveExecutor(),
            new ServerFilesPostDirectoryExecutor(),
            new ServerGcodeStoreExecutor(),
            new ServerInfoExecutor(),
            new ServerJobQueueStatus(),
            new ServerTemperatureStoreExecutor()
        ] as IMethodExecutor<unknown, unknown>[]
    );

    public constructor() {
        super();

        this.fileHandler = new FileHandler();

        if (config.getBoolean("misc.octoprint_compat", true)) {
            new OctoprintEmulator();
        }

        router.use(express.json());
        for (const name in this.methodExecutors) {
            const executor = this.methodExecutors[name]!;

            if (executor.httpMethod === null) continue;
            const method = executor.httpMethod ?? "get";
            const route = `/${(executor.httpName ?? name).replaceAll(".", "/")}`;

            router[method](route, async (req, res) => {
                const requestBody = req.query;
                Object.assign(requestBody, req.body);
                const response = await this.handleMessage(req.socket, executor, requestBody);
                res.type("json");
                res.send(response.toString());
            });
        }
    }
}

export default HttpHandler;