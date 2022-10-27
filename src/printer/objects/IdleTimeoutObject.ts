import PrinterObject from "./PrinterObject";
import MarlinRaker from "../../MarlinRaker";

type TIdleState = "Idle" | "Ready" | "Printing";

interface IObject {
    state: TIdleState;
    printing_time: number;
}

class IdleTimeoutObject extends PrinterObject<IObject> {

    public readonly name = "idle_timeout";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        this.marlinRaker.jobManager.on("stateChange", this.emit.bind(this));
        this.marlinRaker.jobManager.on("durationUpdate", this.emit.bind(this));
    }

    public get(_: string[] | null): IObject {
        return {
            state: this.marlinRaker.jobManager.state === "printing" ? "Printing" : "Idle",
            printing_time: this.marlinRaker.jobManager.printDuration
        };
    }
}

export default IdleTimeoutObject;