import PrinterObject from "./PrinterObject";
import Printer from "../Printer";
import { TVec4 } from "../../util/Utils";

interface IResult {
    speed_factor: number;
    speed: number;
    extrude_factor: number;
    absolute_coordinates: boolean;
    absolute_extrude: boolean;
    homing_origin: TVec4;
    position: TVec4;
    gcode_position: TVec4;
}

class GcodeMoveObject extends PrinterObject<IResult> {

    public readonly name = "gcode_move";
    private readonly printer: Printer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;
        setInterval(this.emit.bind(this), 250);
    }

    public get(_: string[] | null): IResult {
        return {
            speed_factor: this.printer.speedFactor,
            speed: 0.0,
            extrude_factor: this.printer.extrudeFactor,
            absolute_coordinates: this.printer.isAbsolutePositioning,
            absolute_extrude: this.printer.isAbsolutePositioning,
            homing_origin: [0, 0, 0, 0],
            position: this.printer.gcodePosition,
            gcode_position: this.printer.gcodePosition
        };
    }
}

export default GcodeMoveObject;