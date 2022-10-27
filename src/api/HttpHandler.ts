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
import ServerJobQueueStatusExecutor from "./executors/ServerJobQueueStatusExecutor";
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
import ServerHistoryListExecutor from "./executors/ServerHistoryListExecutor";
import ServerHistoryResetTotals from "./executors/ServerHistoryResetTotals";
import ServerHistoryTotals from "./executors/ServerHistoryTotals";
import ServerHistoryGetJobExecutor from "./executors/ServerHistoryGetJobExecutor";
import ServerHistoryDeleteJobExecutor from "./executors/ServerHistoryDeleteJobExecutor";
import MachineRebootExecutor from "./executors/MachineRebootExecutor";
import MachineShutdownExecutor from "./executors/MachineShutdownExecutor";
import MarlinRaker from "../MarlinRaker";
import ServerRestartExecutor from "./executors/ServerRestartExecutor";
import MachineServicesRestartExecutor from "./executors/MachineServicesRestartExecutor";
import MachineServicesStartExecutor from "./executors/MachineServicesStartExecutor";
import MachineServicesStopExecutor from "./executors/MachineServicesStopExecutor";
import PrinterObjectsQueryExecutor from "./executors/PrinterObjectsQueryExecutor";
import PrinterObjectsSubscribeExecutor from "./executors/PrinterObjectsSubscribeExecutor";

class HttpHandler extends MessageHandler {

    public readonly fileHandler: FileHandler;
    private readonly methodExecutors;

    public constructor(marlinRaker: MarlinRaker) {
        super();

        this.methodExecutors = new NamedObjectMap<IMethodExecutor<unknown, unknown>>(
            [
                new AccessOneshotTokenExecutor(marlinRaker),
                new MachineProcStatsExecutor(marlinRaker),
                new MachineRebootExecutor(),
                new MachineServicesRestartExecutor(marlinRaker),
                new MachineServicesStartExecutor(marlinRaker),
                new MachineServicesStopExecutor(marlinRaker),
                new MachineShutdownExecutor(),
                new MachineSystemInfoExecutor(marlinRaker),
                new MachineUpdateClientExecutor(marlinRaker),
                new MachineUpdateFullExecutor(marlinRaker),
                new MachineUpdateStatusExecutor(marlinRaker),
                new MachineUpdateSystemExecutor(marlinRaker),
                new PrinterEmergencyStopExecutor(marlinRaker),
                new PrinterFirmwareRestartExecutor(marlinRaker),
                new PrinterInfoExecutor(marlinRaker),
                new PrinterObjectsListExecutor(marlinRaker),
                new PrinterObjectsQueryExecutor(marlinRaker),
                new PrinterObjectsSubscribeExecutor(marlinRaker),
                new PrinterPrintCancelExecutor(marlinRaker),
                new PrinterPrintPauseExecutor(marlinRaker),
                new PrinterPrintResumeExecutor(marlinRaker),
                new PrinterPrintStartExecutor(marlinRaker),
                new PrinterQueryEndstopsStatusExecutor(marlinRaker),
                new PrinterRestartExecutor(marlinRaker),
                new ServerAnnouncementsListExecutor(),
                new ServerConfigExecutor(),
                new ServerDatabaseDeleteItemExecutor(marlinRaker),
                new ServerDatabaseGetItemExecutor(marlinRaker),
                new ServerDatabaseListExecutor(marlinRaker),
                new ServerDatabasePostItemExecutor(marlinRaker),
                new ServerFilesCopyExecutor(marlinRaker),
                new ServerFilesDeleteDirectoryExecutor(marlinRaker),
                new ServerFilesGetDirectoryExecutor(marlinRaker),
                new ServerFilesListExecutor(marlinRaker),
                new ServerFilesMetadataExecutor(marlinRaker),
                new ServerFilesMoveExecutor(marlinRaker),
                new ServerFilesPostDirectoryExecutor(marlinRaker),
                new ServerGcodeStoreExecutor(marlinRaker),
                new ServerHistoryDeleteJobExecutor(marlinRaker),
                new ServerHistoryGetJobExecutor(marlinRaker),
                new ServerHistoryListExecutor(marlinRaker),
                new ServerHistoryResetTotals(marlinRaker),
                new ServerHistoryTotals(marlinRaker),
                new ServerInfoExecutor(marlinRaker),
                new ServerJobQueueStatusExecutor(marlinRaker),
                new ServerRestartExecutor(marlinRaker),
                new ServerTemperatureStoreExecutor(marlinRaker)
            ] as IMethodExecutor<unknown, unknown>[]
        );

        this.fileHandler = new FileHandler(marlinRaker);

        if (config.getBoolean("misc.octoprint_compat", true)) {
            new OctoprintEmulator(this.fileHandler);
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