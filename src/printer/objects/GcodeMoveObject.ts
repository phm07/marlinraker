import PrinterObject from "./PrinterObject";
import { marlinRaker } from "../../Server";

interface IResult {
    speed_factor: number;
    speed: number;
    extrude_factor: number;
    absolute_coordinates: boolean;
    absolute_extrude: boolean;
    homing_origin: [number, number, number, number];
    position: [number, number, number, number];
    gcode_position: [number, number, number, number];
}

class GcodeMoveObject extends PrinterObject<IResult> {

    public readonly name = "gcode_move";

    public constructor() {
        super();
        setInterval(this.emit.bind(this), 250);
    }

    protected get(_: string[] | null): IResult {
        return {
            speed_factor: marlinRaker.printer?.speedFactor ?? 1.0,
            speed: 0.0,
            extrude_factor: marlinRaker.printer?.extrudeFactor ?? 1.0,
            absolute_coordinates: marlinRaker.printer?.isAbsolutePositioning ?? true,
            absolute_extrude: marlinRaker.printer?.isAbsolutePositioning ?? true,
            homing_origin: [0, 0, 0, 0],
            position: marlinRaker.printer?.gcodePosition ?? [0, 0, 0, 0],
            gcode_position: marlinRaker.printer?.gcodePosition ?? [0, 0, 0, 0]
        };
    }
}

export default GcodeMoveObject;