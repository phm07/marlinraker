import PrinterObject from "./PrinterObject";
import Printer from "../Printer";
import { config } from "../../Server";
import { TVec3 } from "../../util/Utils";

interface IObject {
    homed_axes: string;
    print_time: number;
    estimated_print_time: number;
    extruder: string;
    position: number[];
    max_velocity?: number;
    max_accel?: number;
    max_accel_to_decel?: number;
    square_corner_velocity?: number;
    axis_minimum: number[];
    axis_maximum: number[];
}

class ToolheadObject extends PrinterObject<IObject> {

    public readonly name = "toolhead";
    private readonly printer: Printer;
    private readonly printVolume: TVec3;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;

        setInterval(this.emit.bind(this), 250);
        printer.on("homedAxesChange", this.emit.bind(this));

        this.printVolume = config.getGeneric<TVec3>("printer.print_volume",
            [220, 220, 240], (x): x is TVec3 =>
                typeof x === "object" && Array.isArray(x) && x.length === 3
        );
    }

    public get(_: string[] | null): IObject {
        return {
            homed_axes: this.printer.getHomedAxesString(),
            print_time: 0,
            estimated_print_time: 0,
            extruder: "extruder",
            position: this.printer.actualPosition,
            axis_minimum: [0, 0, 0, 0],
            axis_maximum: [...this.printVolume, 0]
        };
    }
}

export default ToolheadObject;