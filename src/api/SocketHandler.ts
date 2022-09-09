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
import ServerJobQueueStatus from "./executors/ServerJobQueueStatus";
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

interface ISocketResponse {
    id: number;
    jsonrpc: "2.0";
}

class SocketHandler extends MessageHandler {

    private readonly socketServer: WebSocketServer;
    private readonly methodExecutors = new NamedObjectMap<IMethodExecutor<unknown, unknown>>(
        <IMethodExecutor<unknown, unknown>[]>[
            new MachineProcStatsExecutor(),
            new MachineSystemInfoExecutor(),
            new MachineSystemInfoExecutor(),
            new MachineUpdateClientExecutor(),
            new MachineUpdateStatusExecutor(),
            new MachineUpdateSystemExecutor(),
            new PrinterEmergencyStopExecutor(),
            new PrinterFirmwareRestartExecutor(),
            new PrinterGcodeHelpExecutor(),
            new PrinterGcodeScriptExecutor(),
            new PrinterInfoExecutor(),
            new PrinterObjectsListExecutor(),
            new PrinterObjectsSubscribeExecutor(),
            new PrinterPrintCancelExecutor(),
            new PrinterPrintPauseExecutor(),
            new PrinterPrintResumeExecutor(),
            new PrinterPrintStartExecutor(),
            new PrinterRestartExecutor(),
            new ServerAnnouncementsListExecutor(),
            new ServerConfigExecutor(),
            new ServerConnectionIdentifyExecutor(),
            new ServerDatabaseDeleteItemExecutor(),
            new ServerDatabaseGetItemExecutor(),
            new ServerDatabaseListExecutor(),
            new ServerDatabasePostItemExecutor(),
            new ServerFilesCopyExecutor(),
            new ServerFilesDeleteDirectoryExecutor(),
            new ServerFilesDeleteFileExecutor(),
            new ServerFilesGetDirectoryExecutor(),
            new ServerFilesListExecutor(),
            new ServerFilesMetadataExecutor(),
            new ServerFilesMoveExecutor(),
            new ServerFilesPostDirectoryExecutor(),
            new ServerGcodeStoreExecutor(),
            new ServerInfoExecutor(),
            new ServerJobQueueStatus(),
            new ServerTemperatureStoreExecutor()
        ]
    );

    public constructor(socketServer: WebSocketServer) {
        super();
        this.socketServer = socketServer;
        this.socketServer.on("connection", this.connect.bind(this));
    }

    public async broadcast<TParams>(notification: INotification<TParams>): Promise<void> {
        logger.debug(`Broadcast notification: ${JSON.stringify(notification)}`);
        const message = await notification.toString();
        this.socketServer.clients.forEach((client) => {
            client.send(message);
        });
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
            logger.error(`Error while parsing message: ${e}`);
            return;
        }
        const response = await this.handle(socket, json);
        logger.debug(`Response: ${JSON.stringify(response)}`);
        socket.send(JSON.stringify(response));
    }

    private async handle(socket: WebSocket, message: { jsonrpc?: unknown, id?: unknown, method?: unknown, params?: unknown }): Promise<ISocketResponse | string> {
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
            ...typeof response === "string" ? { response } : response,
            id: message.id as number,
            jsonrpc: "2.0"
        };
    }
}

export default SocketHandler;