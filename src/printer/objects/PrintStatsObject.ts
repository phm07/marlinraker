import PrinterObject from "./PrinterObject";
import { marlinRaker } from "../../Server";

type TPrintState = "standby" | "printing" | "paused" | "complete" | "cancelled" | "error";

type TObject = {
    filename: string,
    total_duration: number,
    print_duration: number,
    filament_used: number,
    state: TPrintState,
    message: string
};

class PrintStatsObject extends PrinterObject<TObject> {

    public readonly name = "print_stats";

    public constructor() {
        super();
    }

    public get(_: string[] | null): TObject {
        return {
            filename: marlinRaker.jobManager.currentPrintJob?.filename ?? "",
            total_duration: marlinRaker.jobManager.totalDuration,
            print_duration: marlinRaker.jobManager.printDuration,
            filament_used: 0,
            state: marlinRaker.jobManager.currentPrintJob?.state ?? "standby",
            message: ""
        };
    }
}

export default PrintStatsObject;