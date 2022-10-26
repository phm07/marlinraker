import PrinterObject from "./PrinterObject";
import MarlinRaker from "../../MarlinRaker";

type TPrintState = "standby" | "printing" | "paused" | "complete" | "cancelled" | "error";

interface IObject {
    filename: string;
    total_duration: number;
    print_duration: number;
    filament_used: number;
    state: TPrintState;
    message: string;
}

class PrintStatsObject extends PrinterObject<IObject> {

    private readonly marlinRaker: MarlinRaker;
    public readonly name = "print_stats";

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;
    }

    public get(_: string[] | null): IObject {
        return {
            filename: this.marlinRaker.jobManager.currentPrintJob?.filename ?? "",
            total_duration: this.marlinRaker.jobManager.totalDuration,
            print_duration: this.marlinRaker.jobManager.printDuration,
            filament_used: this.marlinRaker.jobManager.getFilamentUsed(),
            state: this.marlinRaker.jobManager.currentPrintJob?.state ?? "standby",
            message: ""
        };
    }
}

export default PrintStatsObject;