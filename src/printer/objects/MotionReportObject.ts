import PrinterObject from "./PrinterObject";
import { TVec4 } from "../../util/Utils";
import MarlinRaker from "../../MarlinRaker";

interface IObject {
    live_position: TVec4;
    live_velocity: number;
    live_extruder_velocity: number;
}

class MotionReportObject extends PrinterObject<IObject> {

    public readonly name = "motion_report";
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
            live_position: this.marlinRaker.printer?.actualPosition ?? [0, 0, 0, 0],
            live_velocity: this.marlinRaker.printer?.actualSpeed ?? 0,
            live_extruder_velocity: this.marlinRaker.printer?.actualExtruderSpeed ?? 0
        };
    }

    public isAvailable(): boolean {
        return this.marlinRaker.state === "ready";
    }
}

export default MotionReportObject;