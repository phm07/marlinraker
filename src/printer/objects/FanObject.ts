import PrinterObject from "./PrinterObject";
import MarlinRaker from "../../MarlinRaker";

interface IObject {
    speed: number;
    rpm?: number; // @TODO M123?
}

class FanObject extends PrinterObject<IObject> {

    public readonly name = "fan";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        this.marlinRaker.on("stateChange", (state) => {
            if (state === "ready") {
                this.marlinRaker.printer?.on("fanSpeedChange", this.emit.bind(this));
            }
        });
    }

    protected get(): IObject {
        return {
            speed: this.marlinRaker.printer?.fanSpeed ?? 0
        };
    }

    public isAvailable(): boolean {
        return this.marlinRaker.state === "ready";
    }
}

export default FanObject;