import HeaterManager from "./HeaterManager";
import SerialGcodeDevice from "./SerialGcodeDevice";
import ParserUtil, { IHomedAxes, TPrinterCapabilities, IPrinterInfo } from "./ParserUtil";
import { logger } from "../Server";
import SimpleNotification from "../api/notifications/SimpleNotification";
import TemperatureWatcher from "./watchers/TemperatureWatcher";
import PositionWatcher from "./watchers/PositionWatcher";
import Watcher from "./watchers/Watcher";
import { TVec2, TVec4 } from "../util/Utils";
import MarlinRaker from "../MarlinRaker";

interface IPauseState {
    x: number;
    y: number;
    isAbsolute: boolean;
    isAbsoluteE: boolean;
    feedrate: number;
}

interface IBedMesh {
    grid: number[][];
    min: TVec2;
    max: TVec2;
    profile: string;
}

interface IPrinterEvents {
    ready: () => void;
    startup: () => void;
    commandOk: () => void;
    positioningChange: () => void;
    gcodePositionChange: () => void;
    fanSpeedChange: () => void;
    factorChange: () => void;
    homedAxesChange: () => void;
    actualPositionChange: (oldPos: TVec4, newPos: TVec4) => void;
    error: (err: Error) => void;
    updateBedMesh: (bedMesh: IBedMesh) => void;
}

class Printer extends SerialGcodeDevice {

    public heaterManager: HeaterManager;
    public info?: IPrinterInfo;
    public capabilities: TPrinterCapabilities;
    public watchers: Watcher[];
    public actualPosition!: TVec4;
    public gcodePosition!: TVec4;
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

    public constructor(marlinRaker: MarlinRaker, serialPort: string, baudRate: number) {
        super(marlinRaker, serialPort, baudRate);

        this.heaterManager = new HeaterManager(marlinRaker, this);
        this.capabilities = {};
        this.watchers = [];
        this.resetValues();

        this.serialPort.on("close", () => {
            if (marlinRaker.state === "ready") {
                marlinRaker.disconnect("shutdown", "Disconnected from serial port");
            }
        });

        this.on("error", (err) => {
            logger.error(err);
            if (marlinRaker.state === "ready" || marlinRaker.state === "startup") {
                marlinRaker.disconnect("error", err.toString());
            }
        });

        this.on("ready", () => {
            marlinRaker.setState("ready", "Printer ready");
        });

        this.on("startup", () => {
            marlinRaker.setState("startup", "Connecting...");
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

    public emergencyStop(): void {
        void this.queueGcode("M112", true, false);
    }

    protected handleResponseLine(line: string): boolean {

        for (const watcher of this.watchers) {
            if (watcher.handle(line)) return false;
        }

        if (line.startsWith("//")) {
            const action = /^\/\/( *)action:(.*)$/.exec(line)?.[2];
            if (action) {
                Printer.handleAction(action);
            }
            return false;
        }

        {
            const unknownCommand = /^(?:echo:Unknown command|Unknown [A-Z] code): "?(.*?)(?:"|$)/.exec(line)?.[1];
            if (unknownCommand) {
                this.handleUnknownCommand(unknownCommand);
            }
        }

        if (this.marlinRaker.state === "ready" && line.startsWith("echo:")) {
            const response = line.substring(5);
            if (response.startsWith("busy:")) return false;
            void this.marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_gcode_response", [response]));

            this.marlinRaker.gcodeStore.push({
                message: response,
                time: Date.now() / 1000,
                type: "response"
            });
            return false;
        }

        return true;
    }

    private static handleAction(action: string): void {
        const marlinRaker = MarlinRaker.getInstance();

        if (action === "cancel") {
            if (marlinRaker.jobManager.isPrinting()) {
                logger.info("Canceling print");
                void marlinRaker.dispatchCommand("cancel_print", false);
            }

        } else if (action === "pause") {
            if (marlinRaker.jobManager.state === "printing") {
                logger.info("Pausing print");
                void marlinRaker.dispatchCommand("pause", false);
            }

        } else if (action === "resume") {
            if (marlinRaker.jobManager.state === "paused") {
                logger.info("Resuming print");
                void marlinRaker.dispatchCommand("resume", false);
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
            logger.warn("Emergency stop triggered");
            this.marlinRaker.disconnect("error", "Emergency stop triggered");

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
            this.marlinRaker.disconnect("error", "Printer initialization took too long");
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

    public cleanup(): void {
        this.watchers.forEach((watcher) => watcher.cleanup());
        this.heaterManager.cleanup();
        this.removeAllListeners();
    }
}

export { IPauseState, IBedMesh, IPrinterEvents };
export default Printer;