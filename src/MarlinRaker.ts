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
import ParserUtil from "./printer/ParserUtil";
import KlipperCompat from "./compat/KlipperCompat";
import Utils from "./util/Utils";

interface IGcodeLog {
    message: string;
    time: number;
    type: "command" | "response";
}

type TPrinterState = "ready" | "error" | "shutdown" | "startup";

declare interface MarlinRaker {
    on(event: "stateChange", listener: (state: TPrinterState) => void): this;
    emit(eventName: "stateChange", args: TPrinterState): boolean;
}

class MarlinRaker extends EventEmitter {

    public state: TPrinterState;
    public stateMessage: string;

    public readonly gcodeStore: IGcodeLog[];
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
    public readonly klipperCompat: KlipperCompat;
    public printer?: Printer;

    private static instance: MarlinRaker;

    public constructor(wss: WebSocketServer) {
        super();

        MarlinRaker.instance = this;

        this.gcodeStore = [];
        this.state = "startup";
        this.stateMessage = "";
        this.socketHandler = new SocketHandler(this, wss);
        this.httpHandler = new HttpHandler(this);
        this.updateManager = new UpdateManager(this);
        this.connectionManager = new ConnectionManager();
        this.database = new Database();
        this.metadataManager = new MetadataManager(this);
        this.accessManager = new AccessManager();
        this.fileManager = new FileManager(this);
        this.macroManager = new MacroManager(this);
        this.jobManager = new JobManager(this);
        this.jobHistory = new JobHistory(this);
        this.systemInfo = new SystemInfo(this);
        this.klipperCompat = new KlipperCompat(this);

        process.removeAllListeners("uncaughtException");
        process.on("uncaughtException", async (e) => {
            logger.error(e);
            await this.shutdownGracefully();
        });
        ["beforeExit", "SIGINT", "SIGUSR1", "SIGUSR2", "SIGTERM"].forEach((event) => process.on(event, async () => {
            await this.shutdownGracefully();
        }));

        setTimeout(this.connect.bind(this));
    }

    public static getInstance(): MarlinRaker {
        return this.instance;
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
            this.printer = new Printer(this, port, baudRate);
        } else {
            await this.setState("error", "Cannot connect to printer");
        }
    }

    public disconnect(state: TPrinterState, stateMessage: string): void {
        if (this.printer) {
            this.setState(state, stateMessage);
            if (this.printer.serialPort.isOpen) {
                this.printer.serialPort.close();
            }
            delete this.printer;
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

    public async restart(): Promise<void> {
        await this.shutdownGracefully();
    }

    public async dispatchCommand(commandRaw: string, log = true): Promise<void> {
        if (commandRaw.includes("\n")) {
            const promises = [];
            for (const cmd of commandRaw.split(/\r?\n/).filter((s) => s)) {
                promises.push(this.dispatchCommand(cmd, log));
            }
            await Promise.all(promises);
            return;
        }

        const command = ParserUtil.trimGcodeLine(commandRaw);

        try {
            const logCommand = (): void => {
                this.gcodeStore.push({
                    message: commandRaw,
                    time: Date.now() / 1000,
                    type: "command"
                });
            };
            const commandPromise = this.klipperCompat.translateCommand(command);
            if (commandPromise) {
                if (log) logCommand();
                await commandPromise();
                return;
            } else if (await this.macroManager.execute(command)) {
                if (log) logCommand();
                return;
            }
        } catch (e) {
            logger.error(`Error while executing "${command}"`);
            logger.error(e);
            const errorStr = `!! Error on '${command}': ${Utils.errorToString(e)}`;
            await this.socketHandler.broadcast(new SimpleNotification("notify_gcode_response", [errorStr]));
            this.gcodeStore.push({
                message: errorStr,
                time: Date.now() / 1000,
                type: "response"
            });
            return;
        }

        await this.printer?.queueGcode(command, false, log);
    }

    public async shutdownGracefully(): Promise<void> {
        logger.info("Gracefully shutting down...");
        await this.jobManager.finishJob("server_exit");
        await this.socketHandler.shutdown();
        await logger.shutdownGracefully();
        process.exit(0);
    }
}

export { TPrinterState, IGcodeLog };
export default MarlinRaker;