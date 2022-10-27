import { IMethodExecutor } from "./executors/IMethodExecutor";
import { RawData, WebSocket, WebSocketServer } from "ws";
import ServerConnectionIdentifyExecutor from "./executors/ServerConnectionIdentifyExecutor";
import PrinterInfoExecutor from "./executors/PrinterInfoExecutor";
import ServerInfoExecutor from "./executors/ServerInfoExecutor";
import MachineSystemInfoExecutor from "./executors/MachineSystemInfoExecutor";
import { INotification } from "./notifications/INotification";
import ServerConfigExecutor from "./executors/ServerConfigExecutor";
import ServerDatabaseListExecutor from "./executors/ServerDatabaseListExecutor";
import MessageHandler from "./MessageHandler";
import ErrorResponse from "./response/ErrorResponse";
import PrinterObjectsListExecutor from "./executors/PrinterObjectsListExecutor";
import PrinterObjectsSubscribeExecutor from "./executors/PrinterObjectsSubscribeExecutor";
import PrinterRestartExecutor from "./executors/PrinterRestartExecutor";
import ServerTemperatureStoreExecutor from "./executors/ServerTemperatureStoreExecutor";
import ServerDatabaseGetItemExecutor from "./executors/ServerDatabaseGetItemExecutor";
import ServerDatabasePostItemExecutor from "./executors/ServerDatabasePostItemExecutor";
import PrinterGcodeHelpExecutor from "./executors/PrinterGcodeHelpExecutor";
import MachineProcStatsExecutor from "./executors/MachineProcStatsExecutor";
import ServerGcodeStoreExecutor from "./executors/ServerGcodeStoreExecutor";
import PrinterGcodeScriptExecutor from "./executors/PrinterGcodeScriptExecutor";
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
import ServerFilesPostDirectoryExecutor from "./executors/ServerFilesPostDirectoryExecutor";
import ServerFilesDeleteDirectoryExecutor from "./executors/ServerFilesDeleteDirectoryExecutor";
import ServerFilesMoveExecutor from "./executors/ServerFilesMoveExecutor";
import ServerFilesCopyExecutor from "./executors/ServerFilesCopyExecutor";
import ServerFilesDeleteFileExecutor from "./executors/ServerFilesDeleteFileExecutor";
import { logger } from "../Server";
import PrinterFirmwareRestartExecutor from "./executors/PrinterFirmwareRestartExecutor";
import ServerDatabaseDeleteItemExecutor from "./executors/ServerDatabaseDeleteItemExecutor";
import NamedObjectMap from "../util/NamedObjectMap";
import MachineUpdateStatusExecutor from "./executors/MachineUpdateStatusExecutor";
import MachineUpdateClientExecutor from "./executors/MachineUpdateClientExecutor";
import MachineUpdateSystemExecutor from "./executors/MachineUpdateSystemExecutor";
import PrinterQueryEndstopsStatusExecutor from "./executors/PrinterQueryEndstopsStatusExecutor";
import MachineUpdateFullExecutor from "./executors/MachineUpdateFullExecutor";
import Utils from "../util/Utils";
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

interface ISocketResponse {
    id: number;
    jsonrpc: "2.0";
}

class SocketHandler extends MessageHandler {

    private readonly socketServer: WebSocketServer;
    private readonly methodExecutors;

    public constructor(marlinRaker: MarlinRaker, socketServer: WebSocketServer) {
        super();

        this.methodExecutors = new NamedObjectMap<IMethodExecutor<unknown, unknown>>(
            [
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
                new PrinterGcodeHelpExecutor(),
                new PrinterGcodeScriptExecutor(marlinRaker),
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
                new ServerConnectionIdentifyExecutor(marlinRaker),
                new ServerDatabaseDeleteItemExecutor(marlinRaker),
                new ServerDatabaseGetItemExecutor(marlinRaker),
                new ServerDatabaseListExecutor(marlinRaker),
                new ServerDatabasePostItemExecutor(marlinRaker),
                new ServerFilesCopyExecutor(marlinRaker),
                new ServerFilesDeleteDirectoryExecutor(marlinRaker),
                new ServerFilesDeleteFileExecutor(marlinRaker),
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

        this.socketServer = socketServer;
        this.socketServer.on("connection", this.connect.bind(this));
    }

    public async broadcast<TParams>(notification: INotification<TParams>): Promise<void> {
        const message = await notification.toString();
        this.socketServer.clients.forEach((client) => {
            client.send(message);
        });
    }

    public shutdown(): void {
        this.socketServer.close();
    }

    public connect(socket: WebSocket): void {
        socket.on("message", async (data) => {
            await this.message(socket, data);
        });
    }

    public async message(socket: WebSocket, message: RawData): Promise<void> {
        const messageString = message.toString("utf-8");
        logger.debug(`Inbound data: "${messageString}"`);
        let json;
        try {
            json = JSON.parse(messageString);
        } catch (e) {
            logger.error(`Error while parsing message: ${Utils.errorToString(e)}`);
            return;
        }
        const response = await this.handle(socket, json);
        logger.debug(`Response: ${JSON.stringify(response)}`);
        socket.send(JSON.stringify(response));
    }

    private async handle(socket: WebSocket, message: { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown }): Promise<ISocketResponse | string> {
        if (message.jsonrpc !== "2.0" || typeof message.id !== "number" || typeof message.method !== "string") {
            return {
                ...new ErrorResponse(400, "Bad Request"),
                id: typeof message.id === "number" ? message.id : 0,
                jsonrpc: "2.0"
            };
        }
        const executor = this.methodExecutors[message.method];
        const response = await this.handleMessage(socket, executor, message.params);
        return {
            ...response,
            id: message.id as number,
            jsonrpc: "2.0"
        };
    }
}

export default SocketHandler;