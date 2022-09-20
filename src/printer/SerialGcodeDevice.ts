import { ReadLine } from "readline";
import { SerialPort } from "serialport";
import readline from "readline";
import EventEmitter from "events";
import { config, logger } from "../Server";
import ParserUtil from "./ParserUtil";

interface IGcodeLog {
    message: string;
    time: number;
    type: "command" | "response";
}

interface ICommand {
    gcode: string;
    response: string[];
    log: boolean;
    emergency?: boolean;
    callback: () => void;
    queued: number;
    sent?: number;
    completed?: number;
    timeInQueue?: number;
}

abstract class SerialGcodeDevice extends EventEmitter {

    public readonly gcodeStore: IGcodeLog[];
    public hasEmergencyParser: boolean;
    protected readonly serialPort: SerialPort;
    protected readline: ReadLine;
    protected commandQueue: ICommand[];
    protected currentCommand?: ICommand;
    protected ready: boolean;
    private readonly maxConnectionAttempts: number;
    private readonly connectionTimeout: number;

    protected constructor(serialPort: string, baudRate: number) {
        super();

        this.commandQueue = [];
        this.gcodeStore = [];
        this.ready = false;
        this.hasEmergencyParser = false;

        this.maxConnectionAttempts = config.getNumber("serial.max_connection_attempts", 5);
        this.connectionTimeout = config.getNumber("serial.connection_timeout", 5000);

        this.serialPort = new SerialPort({
            path: serialPort,
            baudRate: baudRate,
            autoOpen: false
        });
        this.readline = readline.createInterface(this.serialPort);
        this.readline.on("line", this.readLine.bind(this));
        this.serialPort.on("close", () => {
            this.commandQueue = [];
            this.ready = false;
        });

        this.setup();
    }

    protected abstract handshake(): Promise<boolean>;

    protected abstract setupPrinter(): Promise<void>;

    protected abstract handleResponseLine(line: string): boolean;

    protected abstract handleRequestLine(line: string): void;

    public setup(): void {
        this.emit("startup");
        this.ready = true;
        this.hasEmergencyParser = false;

        this.serialPort.open(async (err) => {
            if (err) {
                this.emit("error", err);
                this.listPossibleSerialPorts();
                return;
            }

            let tryToConnect = true, tries = 0;
            while (tryToConnect) {
                tryToConnect = !await Promise.race([
                    this.handshake(),
                    new Promise<boolean>((resolve) => setTimeout(resolve.bind(this, false), this.connectionTimeout))
                ]);

                if (tryToConnect && ++tries >= this.maxConnectionAttempts) {
                    this.emit("error", "Marlin firmware did not respond");
                    this.serialPort.close(() => {
                        //
                    });
                    return;
                }
            }

            await this.setupPrinter();
        });
    }

    protected resetCommandQueue(): void {
        delete this.currentCommand;
        this.commandQueue = [];
        this.ready = true;
    }

    private readLine(line: string): void {

        logger.debug(`got \t${line}`);

        if (this.handleResponseLine(line)) {
            this.currentCommand?.response.push(line);
        }

        if (line.startsWith("ok")) {
            if (this.currentCommand) {
                this.currentCommand.callback();
                if (!this.currentCommand.emergency) {
                    this.handleRequestLine(this.currentCommand.gcode);
                }
                this.currentCommand.completed = Date.now();
                this.currentCommand.timeInQueue = this.currentCommand.completed - (this.currentCommand.sent ?? 0);
                logger.debug(JSON.stringify(this.currentCommand));
                delete this.currentCommand;
            }
            this.ready = true;
            this.emit("commandOk");
            this.flush();
        }
    }

    public async queueGcode(gcodeRaw: string, important = false, log = true): Promise<string> {

        if (!this.serialPort.writable) {
            throw new Error("Not connected");
        }

        if (gcodeRaw.includes("\n")) {
            const responses = [];
            for (const line of gcodeRaw.split(/\r?\n/).filter((s) => s)) {
                responses.push(await this.queueGcode(line, important, log));
            }
            return responses.join("\n");
        }

        if (log) {
            this.gcodeStore.push({
                message: gcodeRaw,
                time: Date.now() / 1000,
                type: "command"
            });
        }

        const gcode = ParserUtil.trimGcodeLine(gcodeRaw);
        if (!gcode) return "";

        if (this.hasEmergencyParser && ParserUtil.isEmergencyCommand(gcode)) {
            const promise = new Promise<string>((resolve) => {
                this.commandQueue.unshift({
                    gcode,
                    log,
                    emergency: true,
                    response: [],
                    queued: Date.now(),
                    callback: resolve.bind(this, "ok")
                });
            });
            logger.debug(`emgy \t${gcode}`);
            this.serialPort.write(`${gcode}\n`);
            this.handleRequestLine(gcode);
            this.flush();
            return promise;
        }

        return new Promise<string>((resolve) => {
            const commandObject: ICommand = {
                gcode,
                log,
                response: [],
                queued: Date.now(),
                callback: () => {
                    resolve(commandObject.response.join("\n"));
                }
            };
            this.commandQueue[important ? "unshift" : "push"](commandObject);
            this.flush();
        });
    }

    private flush(): void {
        if (this.ready && this.commandQueue.length) {
            this.currentCommand = this.commandQueue.shift()!;
            if (!this.currentCommand.emergency) {
                this.ready = false;
                this.currentCommand.sent = Date.now();
                logger.debug(`sent \t${this.currentCommand.gcode}`);
                this.serialPort.write(this.currentCommand.gcode + "\n");
            }
        }
    }

    private listPossibleSerialPorts(): void {
        SerialPort.list().then(async (ports) => {
            logger.error(`Could not connect to serial port. Is the specified port "${this.serialPort.path}" correct?`);
            logger.error(`Possible ports: ${ports.map((port) => port.path).join(", ")}`);
        });
    }

    public hasCommandsInQueue(): boolean {
        return this.commandQueue.length > 0;
    }
}

export default SerialGcodeDevice;
export { IGcodeLog };