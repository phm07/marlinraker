import PrinterObject from "./PrinterObject";
import MarlinRaker from "../../MarlinRaker";

interface IObject {
    is_paused: boolean;
}

class PauseResumeObject extends PrinterObject<IObject> {

    public readonly name = "pause_resume";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        this.marlinRaker.on("stateChange", this.emit.bind(this));
    }

    public get(_: string[] | null): IObject {
        return {
            is_paused: this.marlinRaker.jobManager.state === "paused"
        };
    }
}

export default PauseResumeObject;