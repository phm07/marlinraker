import PrinterObject from "./PrinterObject";
import { marlinRaker } from "../../Server";
import Printer from "../Printer";

type TResult = {
    speed_factor: number,
    speed: number,
    extrude_factor: number,
    absolute_coordinates: boolean,
    absolute_extrude: boolean,
    homing_origin: [number, number, number, number],
    position: [number, number, number, number],
    gcode_position: [number, number, number, number]
};

class GcodeMoveObject extends PrinterObject<TResult> {

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
        printer.on("positioningChange", () => {
            this.emit();
        });
    }

    protected get(_: string[] | null): TResult {
        return {
            speed_factor: 1.0,
            speed: 0.0,
            extrude_factor: 1.0,
            absolute_coordinates: marlinRaker.printer?.isAbsolutePositioning ?? true,
            absolute_extrude: marlinRaker.printer?.isAbsolutePositioning ?? true,
            homing_origin: [0, 0, 0, 0],
            position: marlinRaker.printer?.toolheadPosition ?? [0, 0, 0, 0],
            gcode_position: marlinRaker.printer?.toolheadPosition ?? [0, 0, 0, 0]
        };
    }
}

export default GcodeMoveObject;