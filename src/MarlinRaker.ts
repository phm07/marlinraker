import ConnectionManager from "./connection/ConnectionManager";
import SocketHandler from "./api/SocketHandler";
import { WebSocketServer } from "ws";
import Printer from "./printer/Printer";
import HttpHandler from "./api/HttpHandler";
import Database from "./database/Database";
import AccessManager from "./auth/AccessManager";
import FileManager from "./files/FileManager";
import JobManager from "./printer/jobs/JobManager";
import MacroManager from "./printer/macros/MacroManager";
import MetadataManager from "./files/MetadataManager";
import UpdateManager from "./update/UpdateManager";
import SystemInfo from "./system/SystemInfo";
import JobHistory from "./printer/jobs/JobHistory";
import EventEmitter from "events";
import SimpleNotification from "./api/notifications/SimpleNotification";
import SerialPortSearch from "./util/SerialPortSearch";
import { config, logger } from "./Server";

type TPrinterState = "ready" | "error" | "shutdown" | "startup";

declare interface MarlinRaker {
    on(event: "stateChange", listener: (state: TPrinterState) => void): this;
    emit(eventName: "stateChange", args: TPrinterState): boolean;
}

class MarlinRaker extends EventEmitter {

    public state: TPrinterState;
    public stateMessage: string;

    public readonly socketHandler: SocketHandler;
    public readonly httpHandler: HttpHandler;
    public readonly updateManager: UpdateManager;
    public readonly connectionManager: ConnectionManager;
    public readonly database: Database;
    public readonly metadataManager: MetadataManager;
    public readonly accessManager: AccessManager;
    public readonly jobManager: JobManager;
    public readonly jobHistory: JobHistory;
    public readonly fileManager: FileManager;
    public readonly macroManager: MacroManager;
    public readonly systemInfo: SystemInfo;
    public printer?: Printer;

    public constructor(wss: WebSocketServer) {
        super();

        this.state = "startup";
        this.stateMessage = "";
        this.socketHandler = new SocketHandler(wss);
        this.httpHandler = new HttpHandler();
        this.updateManager = new UpdateManager();
        this.connectionManager = new ConnectionManager();
        this.database = new Database();
        this.metadataManager = new MetadataManager(this);
        this.accessManager = new AccessManager();
        this.fileManager = new FileManager();
        this.macroManager = new MacroManager();
        this.jobManager = new JobManager(this);
        this.jobHistory = new JobHistory(this);
        this.systemInfo = new SystemInfo();

        setTimeout(this.connect.bind(this));
    }

    public setState(state: TPrinterState, stateMessage: string): void {
        this.stateMessage = stateMessage;
        this.state = state;
        this.emit("stateChange", state);

        if (state === "ready") {
            void this.socketHandler.broadcast(new SimpleNotification("notify_klippy_ready"));
        } else if (state === "shutdown") {
            void this.socketHandler.broadcast(new SimpleNotification("notify_klippy_shutdown"));
        }
    }

    public async connect(): Promise<void> {
        if (this.printer) return;
        this.setState("startup", "Connecting...");

        let port: string | null = config.getString("serial.port", "auto");
        let baudRate: number | null = Number.parseInt(config.getStringOrNumber("serial.baud_rate", "auto") as string);
        if (!port || port.toLowerCase() === "auto") {
            const serialPortSearch = new SerialPortSearch(baudRate);
            [port, baudRate] = await serialPortSearch.findSerialPort() ?? [null, null];
        }

        if (!port) {
            logger.error("Could not determine serial port to connect to.");
        } else {
            logger.info(`Using serial port ${port} with baud rate ${baudRate}`);
        }

        if (port && baudRate) {
            this.printer = new Printer(port, baudRate);
        } else {
            await this.setState("error", "Cannot connect to printer");
        }
    }

    public disconnect(state: TPrinterState, stateMessage: string): void {
        if (this.printer) {
            if (this.printer.serialPort.isOpen) {
                this.printer.serialPort.close();
            }
            delete this.printer;
            this.setState(state, stateMessage);
        }
    }

    public async reconnect(): Promise<void> {
        if (this.printer) {
            this.printer.serialPort.write("M997\n");
            if (this.printer.serialPort.isOpen) {
                this.printer.serialPort.close();
            }
            delete this.printer;
        }
        await this.connect();
    }

    public restart(): void {
        process.exit(0);
    }
}

export { TPrinterState };
export default MarlinRaker;