import PrinterObject from "./PrinterObject";
import { marlinRaker } from "../../Server";
import Printer from "../Printer";

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

    public constructor(printer: Printer) {
        super();
        let lastEmit = 0;
        printer.on("positionChange", () => {
            const now = Date.now();
            if (now - lastEmit < 250) return; // avoid spamming
            lastEmit = now;
            this.emit();
        });
        printer.on("positioningChange", this.emit.bind(this));
        printer.on("factorChange", this.emit.bind(this));
    }

    protected get(_: string[] | null): IResult {
        return {
            speed_factor: marlinRaker.printer?.speedFactor ?? 1.0,
            speed: 0.0,
            extrude_factor: marlinRaker.printer?.extrudeFactor ?? 1.0,
            absolute_coordinates: marlinRaker.printer?.isAbsolutePositioning ?? true,
            absolute_extrude: marlinRaker.printer?.isAbsolutePositioning ?? true,
            homing_origin: [0, 0, 0, 0],
            position: marlinRaker.printer?.toolheadPosition ?? [0, 0, 0, 0],
            gcode_position: marlinRaker.printer?.toolheadPosition ?? [0, 0, 0, 0]
        };
    }
}

export default GcodeMoveObject;