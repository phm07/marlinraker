import PrinterObject from "./PrinterObject";
import Printer from "../Printer";
import { config } from "../../Server";

type TObject = {
    homed_axes: string,
    print_time: number,
    estimated_print_time: number,
    extruder: string,
    position: number[],
    max_velocity?: number,
    max_accel?: number,
    max_accel_to_decel?: number,
    square_corner_velocity?: number,
    axis_minimum: number[],
    axis_maximum: number[]
};

class ToolheadObject extends PrinterObject<TObject> {

    public readonly name = "toolhead";
    private readonly printer: Printer;
    private readonly printVolume: [number, number, number];

    public constructor(printer: Printer) {
        super();
        this.printer = printer;

        setInterval(this.emit.bind(this), 250);
        printer.on("homedAxesChange", this.emit.bind(this));

        this.printVolume = [
            config.getOrDefault("printer.print_volume.x", 0),
            config.getOrDefault("printer.print_volume.y", 0),
            config.getOrDefault("printer.print_volume.z", 0)
        ];
    }

    public get(_: string[] | null): TObject {
        return {
            homed_axes: this.printer.getHomedAxesString(),
            print_time: 0,
            estimated_print_time: 0,
            extruder: "extruder",
            position: this.printer.toolheadPosition,
            axis_minimum: [0, 0, 0, 0],
            axis_maximum: [...this.printVolume, 0]
        };
    }
}

export default ToolheadObject;