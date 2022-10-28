import PrinterObject from "./PrinterObject";
import { TVec4 } from "../../util/Utils";
import MarlinRaker from "../../MarlinRaker";

interface IObject {
    speed_factor: number;
    speed: number;
    extrude_factor: number;
    absolute_coordinates: boolean;
    absolute_extrude: boolean;
    homing_origin: TVec4;
    position: TVec4;
    gcode_position: TVec4;
}

class GcodeMoveObject extends PrinterObject<IObject> {

    public readonly name = "gcode_move";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        setInterval(() => {
            if (this.isAvailable()) this.emit();
        }, 250);
    }

    protected get(): IObject {
        return {
            speed_factor: this.marlinRaker.printer?.speedFactor ?? 1,
            speed: 0.0,
            extrude_factor: this.marlinRaker.printer?.extrudeFactor ?? 1,
            absolute_coordinates: this.marlinRaker.printer?.isAbsolutePositioning ?? true,
            absolute_extrude: this.marlinRaker.printer?.isAbsolutePositioning ?? true,
            homing_origin: [0, 0, 0, 0],
            position: this.marlinRaker.printer?.gcodePosition ?? [0, 0, 0, 0],
            gcode_position: this.marlinRaker.printer?.gcodePosition ?? [0, 0, 0, 0]
        };
    }

    public isAvailable(): boolean {
        return this.marlinRaker.state === "ready";
    }
}

export default GcodeMoveObject;