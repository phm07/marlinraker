import PrinterObject from "./PrinterObject";
import { config } from "../../Server";
import { TVec3 } from "../../util/Utils";
import MarlinRaker from "../../MarlinRaker";

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
    private readonly marlinRaker: MarlinRaker;
    private readonly printVolume: TVec3;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        setInterval(() => {
            if (this.isAvailable()) this.emit();
        }, 250);

        this.marlinRaker.on("stateChange", (state) => {
            if (state === "ready") {
                this.marlinRaker.printer?.on("homedAxesChange", this.emit.bind(this));
            }
        });

        this.printVolume = config.getGeneric<TVec3>("printer.print_volume",
            [220, 220, 240], (x): x is TVec3 =>
                typeof x === "object" && Array.isArray(x) && x.length === 3
        );
    }

    protected get(): IObject {
        return {
            homed_axes: this.marlinRaker.printer?.getHomedAxesString() ?? "",
            print_time: 0,
            estimated_print_time: 0,
            extruder: "extruder",
            position: this.marlinRaker.printer?.actualPosition ?? [0, 0, 0, 0],
            axis_minimum: [0, 0, 0, 0],
            axis_maximum: [...this.printVolume, 0]
        };
    }

    public isAvailable(): boolean {
        return this.marlinRaker.state === "ready";
    }
}

export default ToolheadObject;