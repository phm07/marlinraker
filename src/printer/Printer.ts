import ObjectManager from "./objects/ObjectManager";
import HeaterManager from "./HeaterManager";
import SerialGcodeDevice from "./SerialGcodeDevice";
import ParserUtil, { IHomedAxes, TPrinterCapabilities, IPrinterInfo } from "./ParserUtil";
import { config, logger, marlinRaker } from "../Server";
import SimpleNotification from "../api/notifications/SimpleNotification";
import TemperatureWatcher from "./watchers/TemperatureWatcher";
import PositionWatcher from "./watchers/PositionWatcher";
import Watcher from "./watchers/Watcher";
import KlipperCompat from "../compat/KlipperCompat";
import SDCardWatcher from "./watchers/SDCardWatcher";
import StringUtil from "../util/StringUtil";

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
    public toolheadPosition!: [number, number, number, number];
    public isAbsolutePositioning!: boolean;
    public isAbsoluteEPositioning!: boolean;
    public feedrate!: number;
    public fanSpeed!: number;
    public speedFactor!: number;
    public extrudeFactor!: number;
    public isSdCard!: boolean;
    public homedAxes!: IHomedAxes;
    public isM73Supported!: boolean;
    public isPrusa!: boolean;
    public pauseState?: IPauseState;

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
    }

    private resetValues(): void {
        this.toolheadPosition = [0, 0, 0, 0];
        this.isAbsolutePositioning = true;
        this.isAbsoluteEPositioning = true;
        this.feedrate = 0;
        this.fanSpeed = 0;
        this.speedFactor = 1.0;
        this.extrudeFactor = 1.0;
        this.isSdCard = false;
        this.homedAxes = { x: false, y: false, z: false };
        this.isM73Supported = true;
        this.isPrusa = false;
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
            const unknownCommand = /^echo:Unknown command: "(.*)"/.exec(line)?.[1];
            if (unknownCommand) {
                this.handleUnknownCommand(unknownCommand);
            }
        }

        if (this.state === "ready" && line.startsWith("echo:")) {
            const response = line.substring(5);
            if (response === "busy: processing") return false;
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
            logger.info("Canceling print");
            void this.dispatchCommand("cancel_print", false);

        } else if (action === "pause") {
            logger.info("Pausing print");
            void this.dispatchCommand("pause", false);

        } else if (action === "resume") {
            logger.info("Resuming print");
            void this.dispatchCommand("resume", false);
        }
    }

    private handleUnknownCommand(command: string): void {
        logger.warn(`Unknown command: "${command}"`);

        if (/^M2[01](\s|$)/.test(command)) {
            if (this.isSdCard) {
                logger.warn("SD Card support was enabled in config but is not supported by printer");
                this.isSdCard = false;
            }

        } else if (/^M73(\s|$)/.test(command)) {
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
                ["X", "Y", "Z", "E"].forEach((s, i) => {
                    this.toolheadPosition[i] = positions[s] ?? this.toolheadPosition[i];
                });
            } else {
                if (this.isAbsolutePositioning) {
                    ["X", "Y", "Z"].forEach((s, i) => {
                        this.toolheadPosition[i] = positions[s] ?? this.toolheadPosition[i];
                    });
                } else {
                    ["X", "Y", "Z"].forEach((s, i) => {
                        this.toolheadPosition[i] += positions[s] ?? 0;
                    });
                }
                if (this.isAbsoluteEPositioning) {
                    this.toolheadPosition[3] = positions.E ?? this.toolheadPosition[3];
                } else {
                    this.toolheadPosition[3] += positions.E ?? 0;
                }

                this.feedrate = positions.F ?? this.feedrate;
            }
            this.emit("positionChange");

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

        const timeout = setTimeout(() => {
            this.setState("error", "Printer initialization took too long");
            this.serialPort.close(() => {
                //
            });
        }, 10000);

        this.isPrusa = this.info?.firmwareName.startsWith("Prusa-Firmware") ?? false;
        this.hasEmergencyParser = this.capabilities.EMERGENCY_PARSER || this.isPrusa;

        const sdCardConfig = config.getBoolean("misc.sd_card", true);
        this.isSdCard = this.capabilities.SDCARD !== false && sdCardConfig;
        if (this.isSdCard !== sdCardConfig) {
            logger.warn("SD Card support was enabled in config but is not supported by printer");
        }

        this.watchers = [
            new TemperatureWatcher(this),
            new PositionWatcher(this)
        ];

        if (this.isPrusa) {
            await this.queueGcode(`M155 S1 C${1 << 0 | 1 << 2}`, false, false);
        }

        if (this.isSdCard) {
            await this.queueGcode("M21", false, false);
            this.watchers.push(new SDCardWatcher("SD"));
        }

        await Promise.all(this.watchers.map(async (watcher) => watcher.waitForLoad()));

        this.resetValues();
        this.emit("ready");
        clearTimeout(timeout);
    }

    public async dispatchCommand(command: string, log = true): Promise<void> {
        if (command.includes("\n")) {
            for (const cmd of command.split(/\r?\n/).filter((s) => s)) {
                await this.dispatchCommand(cmd, log);
            }
            return;
        }

        try {
            const logCommand = (): void => {
                this.gcodeStore.push({
                    message: command,
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
            const errorStr = `!! Error on '${command}': ${StringUtil.errorToString(e)}`;
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
}

export { TPrinterState, IPauseState };
export default Printer;