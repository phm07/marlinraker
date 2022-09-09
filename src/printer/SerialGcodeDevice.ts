import { ReadLine } from "readline";
import { SerialPort } from "serialport";
import readline from "readline";
import EventEmitter from "events";
import { logger } from "../Server";

type TGcodeLog = { message: string, time: number, type: "command" | "response" };

type TCommand = {
    command: string,
    log: boolean,
    callback: (response: string) => void,
    queued: number,
    sent?: number,
    completed?: number,
    timeInBuffer?: number
};

abstract class SerialGcodeDevice extends EventEmitter {

    public readonly gcodeStore: TGcodeLog[];
    protected readonly serialPort: SerialPort;
    protected readline: ReadLine;
    protected commandQueue: TCommand[];
    protected currentCommand?: TCommand;
    protected currentLines: string[];
    protected ready: boolean;

    protected constructor(serialPort: string, baudRate: number) {
        super();

        this.currentLines = [];
        this.commandQueue = [];
        this.gcodeStore = [];
        this.ready = false;

        this.serialPort = new SerialPort({
            path: serialPort,
            baudRate: baudRate,
            autoOpen: false
        });
        this.readline = readline.createInterface(this.serialPort);
        this.readline.on("line", this.readLine.bind(this));
        this.serialPort.on("close", () => {
            this.currentLines = [];
            this.commandQueue = [];
            this.ready = false;
        });

        this.setup();
    }

    protected abstract setupPrinter(): Promise<void>;

    public setup(): void {
        this.emit("startup");
        this.ready = true;

        this.serialPort.open((err) => {
            if (err) {
                this.emit("error", err);
                this.listPossibleSerialPorts();
                return;
            }

            const timeout = setTimeout(() => {
                this.emit("error", "Marlin firmware did not respond");
                this.serialPort.close(() => {
                    //
                });
            }, 5000);

            this.once("ready", () => {
                clearTimeout(timeout);
            });

            void this.setupPrinter();
        });
    }

    protected abstract handleResponseLine(line: string): boolean;

    protected abstract handleRequestLine(line: string): void;

    private readLine(line: string): void {

        if (this.handleResponseLine(line)) {
            this.currentLines.push(line);
        }

        if (line.startsWith("ok")) {
            if (this.currentCommand) {
                logger.debug(`Response: ${JSON.stringify(this.currentLines.join("\n"))}`);
                this.currentCommand.callback(this.currentLines.join("\n"));
                this.handleRequestLine(this.currentCommand.command);
                this.currentCommand.completed = Date.now();
                this.currentCommand.timeInBuffer = this.currentCommand.completed - (this.currentCommand.sent ?? 0);
                logger.debug(JSON.stringify(this.currentCommand));
                delete this.currentCommand;
            }
            this.currentLines = [];
            this.ready = true;
            this.emit("commandOk");
            this.flush();
        }

        logger.debug(`got \t${line}`);
    }

    public async queueGcode(command: string, important = false, log = true): Promise<string> {

        if (command.indexOf("\n") !== -1) {
            const responses = [];
            for (const gcode of command.split("\n").filter((s) => s)) {
                responses.push(await this.queueGcode(gcode, important, log));
            }
            return responses.join("\n");
        }

        if (!this.serialPort.writable) {
            throw "Not connected";
        }
        if (log) {
            this.gcodeStore.push({
                message: command,
                time: Date.now() / 1000,
                type: "command"
            });
        }
        return new Promise<string>((resolve) => {
            this.commandQueue[important ? "unshift" : "push"]({
                command,
                log,
                queued: Date.now(),
                callback: resolve
            });
            this.flush();
        });
    }

    private flush(): void {
        if (this.ready && this.commandQueue.length) {
            this.ready = false;
            this.currentCommand = this.commandQueue.shift()!;
            this.serialPort.write(this.currentCommand.command + "\n");
            logger.debug(`sent \t${this.currentCommand.command}`);
            this.currentCommand.sent = Date.now();
        }
    }

    private listPossibleSerialPorts(): void {
        SerialPort.list().then(async (ports) => {
            logger.error(`Could not connect to serial port. Is the specified port "${this.serialPort.path}" correct?`);
            logger.error(`Possible ports: ${ports.map((port) => port.path).join(", ")}`);
        });
    }
}

export default SerialGcodeDevice;
export { TGcodeLog };