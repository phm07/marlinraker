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

class MarlinRaker {

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
    public readonly printer?: Printer;

    public constructor(wss: WebSocketServer, port: string | null, baudRate: number | null) {
        this.socketHandler = new SocketHandler(wss);
        this.httpHandler = new HttpHandler();
        this.updateManager = new UpdateManager();
        this.connectionManager = new ConnectionManager();
        this.database = new Database();
        this.metadataManager = new MetadataManager(this.database);
        this.accessManager = new AccessManager();
        this.fileManager = new FileManager();
        this.macroManager = new MacroManager();
        this.jobManager = new JobManager();
        this.jobHistory = new JobHistory(this.database);
        this.systemInfo = new SystemInfo();

        if (port && baudRate) {
            try {
                this.printer = new Printer(port, baudRate);
            } catch (_) {
                //
            }
        }
    }

    public restart(): void {
        process.exit(0);
    }
}

export default MarlinRaker;