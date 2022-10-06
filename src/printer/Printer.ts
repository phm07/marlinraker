import ObjectManager from "./objects/ObjectManager";
import HeaterManager from "./HeaterManager";
import SerialGcodeDevice from "./SerialGcodeDevice";
import ParserUtil, { IHomedAxes, TPrinterCapabilities, IPrinterInfo } from "./ParserUtil";
import { logger, marlinRaker } from "../Server";
import SimpleNotification from "../api/notifications/SimpleNotification";
import TemperatureWatcher from "./watchers/TemperatureWatcher";
import PositionWatcher from "./watchers/PositionWatcher";
import Watcher from "./watchers/Watcher";
import KlipperCompat from "../compat/KlipperCompat";
import Utils from "../util/Utils";

type TPrinterState = "ready" | "error" | "shutdown" | "startup";

interface IPauseState {
    x: number;
    y: number;
    isAbsolute: boolean;
    isAbsoluteE: boolean;
    feedrate: number;
}

class Printer extends SerialGcodeDevice {

    public objectManager: ObjectManager;
    public heaterManager: HeaterManager;
    public state: TPrinterState;
    public info?: IPrinterInfo;
    public stateMessage: string;
    public capabilities: TPrinterCapabilities;
    public watchers: Watcher[];
    public actualPosition!: [number, number, number, number];
    public gcodePosition!: [number, number, number, number];
    public isAbsolutePositioning!: boolean;
    public isAbsoluteEPositioning!: boolean;
    public feedrate!: number;
    public fanSpeed!: number;
    public speedFactor!: number;
    public extrudeFactor!: number;
    public homedAxes!: IHomedAxes;
    public isM73Supported!: boolean;
    public isPrusa!: boolean;
    public pauseState?: IPauseState;
    public actualSpeed!: number;
    public actualExtruderSpeed!: number;
    public extrudedFilamentOffset!: number;

    public constructor(serialPort: string, baudRate: number) {
        super(serialPort, baudRate);

        this.state = "startup";
        this.stateMessage = "";
        this.objectManager = new ObjectManager(this);
        this.heaterManager = new HeaterManager(this);
        this.capabilities = {};
        this.watchers = [];
        this.resetValues();

        this.serialPort.on("close", () => {
            if (this.state === "ready") {
                this.setState("shutdown", "Disconnected from serial port");
            }
            delete this.info;
            this.objectManager = new ObjectManager(this);
            this.heaterManager = new HeaterManager(this);
            this.capabilities = {};
            this.watchers.forEach((w) => w.delete());
            this.watchers = [];
        });

        this.on("error", (err) => {
            logger.error(err);
            if (this.state === "ready" || this.state === "startup") {
                this.setState("error", err.toString());
            }
        });

        this.on("ready", () => {
            this.setState("ready");
        });

        this.on("startup", () => {
            this.setState("startup");
        });

        this.on("stateChange", async (state: TPrinterState) => {
            if (state !== "ready") {
                await marlinRaker.jobHistory.saveCurrentJob("klippy_shutdown");
            }
        });
    }

    private resetValues(): void {
        this.actualPosition = [0, 0, 0, 0];
        this.gcodePosition = [0, 0, 0, 0];
        this.isAbsolutePositioning = true;
        this.isAbsoluteEPositioning = true;
        this.feedrate = 0;
        this.fanSpeed = 0;
        this.speedFactor = 1.0;
        this.extrudeFactor = 1.0;
        this.homedAxes = { x: false, y: false, z: false };
        this.isM73Supported = true;
        this.isPrusa = false;
        this.actualSpeed = 0;
        this.actualExtruderSpeed = 0;
        this.extrudedFilamentOffset = 0;
    }

    public async connect(): Promise<void> {
        if (this.serialPort.isOpen) {
            await new Promise<void>((resolve) => this.serialPort.close(() => {
                resolve();
            }));
        }
        this.setup();
    }

    public setState(state: TPrinterState, stateMessage?: string): void {
        this.state = state;
        this.stateMessage = stateMessage ?? "";
        this.emit("stateChange");

        if (state === "ready") {
            void marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_klippy_ready"));
        } else if (state === "shutdown") {
            void marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_klippy_shutdown"));
        }
    }

    public emergencyStop(): void {
        void this.queueGcode("M112", true, false);
    }

    public reset(): void {
        this.serialPort.write("M997\n");
        if (this.serialPort.isOpen) {
            this.serialPort.close();
        }
    }

    protected handleResponseLine(line: string): boolean {

        for (const watcher of this.watchers) {
            if (watcher.handle(line)) return false;
        }

        if (line.startsWith("//")) {
            const action = /^\/\/( *)action:(.*)$/.exec(line)?.[2];
            if (action) {
                this.handleAction(action);
            }
            return false;
        }

        {
            const unknownCommand = /^(?:echo:Unknown command|Unknown [A-Z] code): "?(.*?)(?:"|$)/.exec(line)?.[1];
            if (unknownCommand) {
                this.handleUnknownCommand(unknownCommand);
            }
        }

        if (this.state === "ready" && line.startsWith("echo:")) {
            const response = line.substring(5);
            if (response.startsWith("busy:")) return false;
            void marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_gcode_response", [response]));

            this.gcodeStore.push({
                message: response,
                time: Date.now() / 1000,
                type: "response"
            });
            return false;
        }

        return true;
    }

    private handleAction(action: string): void {
        if (action === "cancel") {
            if (marlinRaker.jobManager.isPrinting()) {
                logger.info("Canceling print");
                void this.dispatchCommand("cancel_print", false);
            }

        } else if (action === "pause") {
            if (marlinRaker.jobManager.currentPrintJob?.state === "printing") {
                logger.info("Pausing print");
                void this.dispatchCommand("pause", false);
            }

        } else if (action === "resume") {
            if (marlinRaker.jobManager.currentPrintJob?.state === "paused") {
                logger.info("Resuming print");
                void this.dispatchCommand("resume", false);
            }
        }
    }

    private handleUnknownCommand(command: string): void {
        logger.warn(`Unknown command: "${command}"`);

        if (/^M73(\s|$)/.test(command)) {
            if (this.isM73Supported) {
                logger.warn("Printer does not support M73 command");
                this.isM73Supported = false;
            }
        }
    }

    protected handleRequestLine(line: string): void {
        if (/^G90(\s|$)/.test(line)) {
            this.isAbsolutePositioning = true;
            this.isAbsoluteEPositioning = true;
            this.emit("positioningChange");

        } else if (/^G91(\s|$)/.test(line)) {
            this.isAbsolutePositioning = false;
            this.isAbsoluteEPositioning = false;
            this.emit("positioningChange");

        } else if (/^M82(\s|$)/.test(line)) {
            this.isAbsoluteEPositioning = true;
            this.emit("positioningChange");

        } else if (/^M83(\s|$)/.test(line)) {
            this.isAbsoluteEPositioning = false;
            this.emit("positioningChange");

        } else if (/^G(0|1|92)(\s|$)/.test(line)) {
            const positions = ParserUtil.parseG0G1G92Request(line);
            if (line.startsWith("G92")) {
                if (positions.E !== undefined) {
                    this.extrudedFilamentOffset += this.gcodePosition[3] - positions.E;
                }
                this.gcodePosition = [...this.gcodePosition]; // do not modify original array
                ["X", "Y", "Z", "E"].forEach((s, i) => {
                    this.gcodePosition[i] = positions[s] ?? this.gcodePosition[i];
                });
            } else {
                this.gcodePosition = [...this.gcodePosition];
                if (this.isAbsolutePositioning) {
                    ["X", "Y", "Z"].forEach((s, i) => {
                        this.gcodePosition[i] = positions[s] ?? this.gcodePosition[i];
                    });
                } else {
                    ["X", "Y", "Z"].forEach((s, i) => {
                        this.gcodePosition[i] += positions[s] ?? 0;
                    });
                }
                if (this.isAbsoluteEPositioning) {
                    this.gcodePosition[3] = positions.E ?? this.gcodePosition[3];
                } else {
                    this.gcodePosition[3] += positions.E ?? 0;
                }

                this.feedrate = positions.F ?? this.feedrate;
            }
            this.emit("gcodePositionChange");

        } else if (/^M106(\s|$)/.test(line)) {
            const fanSpeed = ParserUtil.parseM106Request(line);
            this.fanSpeed = fanSpeed / 255;
            this.emit("fanSpeedChange");

        } else if (/^M107(\s|$)/.test(line)) {
            this.fanSpeed = 0;
            this.emit("fanSpeedChange");

        } else if (/^M22[01](\s|$)/.test(line)) {
            const factor = ParserUtil.parseM220M221Request(line);
            if (!factor) return;
            this[line.startsWith("M220") ? "speedFactor" : "extrudeFactor"] = factor / 100;
            this.emit("factorChange");

        } else if (/^G28(\s|$)/.test(line)) {
            this.homedAxes = ParserUtil.parseG28Request(line, this.homedAxes);
            this.emit("homedAxesChange");

        } else if (/^M(18|84|410)(\s|$)/.test(line)) {
            this.homedAxes = { x: false, y: false, z: false };
            this.emit("homedAxesChange");

        } else if (/^M112(\s|$)/.test(line)) {
            this.emit("error", "Emergency stop triggered");
            if (this.serialPort.isOpen) {
                this.serialPort.close();
            }

        } else if (/^M118(\s|$)/.test(line) && this.isPrusa) {
            const parts = line.split(" ").slice(1);
            let result = "";
            if (parts[0] === "E1") {
                result += "echo:";
                parts.shift();
            } else if (parts[0] === "A1") {
                result += "//";
                parts.shift();
            }
            result += parts.join(" ");
            this.handleResponseLine(result);
        }
    }

    protected async handshake(): Promise<boolean> {
        this.resetCommandQueue();
        const infoResponse = await this.queueGcode("M115", false, false);
        try {
            [this.info, this.capabilities] = ParserUtil.parseM115Response(infoResponse);
        } catch (_) {
            return false;
        }

        logger.info(`Identified ${this.info.machineType} on ${this.info.firmwareName} with ${Object.keys(this.capabilities).length} capabilities`);
        logger.debug(`Printer info:\n${JSON.stringify(this.info, null, 2)}`);
        logger.debug(`Printer capabilities:\n${JSON.stringify(this.capabilities, null, 2)}`);
        return true;
    }

    protected async setupPrinter(): Promise<void> {

        this.resetValues();

        const timeout = setTimeout(() => {
            this.setState("error", "Printer initialization took too long");
            this.serialPort.close(() => {
                //
            });
        }, 10000);

        this.isPrusa = this.info?.firmwareName.startsWith("Prusa-Firmware") ?? false;
        if (this.isPrusa) {
            logger.info("Printer runs Prusa-Firmware");
        }

        this.hasEmergencyParser = this.capabilities.EMERGENCY_PARSER || this.isPrusa;

        this.watchers = [
            new TemperatureWatcher(this),
            new PositionWatcher(this)
        ];

        if (this.isPrusa) {
            await this.queueGcode(`M155 S1 C${1 << 0}`, false, false);
        }

        await Promise.all(this.watchers.map(async (watcher) => watcher.waitForLoad()));

        this.emit("ready");
        clearTimeout(timeout);
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
            const commandPromise = KlipperCompat.translateCommand(command);
            if (commandPromise) {
                if (log) logCommand();
                await commandPromise();
                return;
            } else if (await marlinRaker.macroManager.execute(command)) {
                if (log) logCommand();
                return;
            }
        } catch (e) {
            logger.error(`Error while executing "${command}"`);
            logger.error(e);
            const errorStr = `!! Error on '${command}': ${Utils.errorToString(e)}`;
            await marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_gcode_response", [errorStr]));
            this.gcodeStore.push({
                message: errorStr,
                time: Date.now() / 1000,
                type: "response"
            });
            return;
        }
        await this.queueGcode(command, false, log);
    }

    public async restart(): Promise<void> {
        await this.setState("startup");
        await this.reset();
        await this.connect();
    }

    public async queryEndstops(): Promise<Record<string, string>> {
        const response = await this.queueGcode("M119", false, false);
        return ParserUtil.parseM119Response(response);
    }

    public getHomedAxesString(): string {
        let s = "";
        if (this.homedAxes.x) s += "x";
        if (this.homedAxes.y) s += "y";
        if (this.homedAxes.z) s += "z";
        return s;
    }

    public getExtrudedFilament(): number {
        return this.extrudedFilamentOffset + this.gcodePosition[3];
    }
}

export { TPrinterState, IPauseState };
export default Printer;