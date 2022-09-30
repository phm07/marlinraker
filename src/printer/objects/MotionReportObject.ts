import PrinterObject from "./PrinterObject";
import { marlinRaker } from "../../Server";

interface IObject {
    live_position: [number, number, number, number];
    live_velocity: number;
    live_extruder_velocity: number;
}

class MotionReportObject extends PrinterObject<IObject> {

    public readonly name = "motion_report";

    public constructor() {
        super();

        setInterval(this.emit.bind(this), 250);
    }

    protected get(_: string[] | null): IObject {
        return {
            live_position: marlinRaker.printer?.actualPosition ?? [0, 0, 0, 0],
            live_velocity: marlinRaker.printer?.actualSpeed ?? 0,
            live_extruder_velocity: marlinRaker.printer?.actualExtruderSpeed ?? 0
        };
    }
}

export default MotionReportObject;