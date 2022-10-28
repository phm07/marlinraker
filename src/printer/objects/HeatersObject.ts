import PrinterObject from "./PrinterObject";
import MarlinRaker from "../../MarlinRaker";

interface IObject {
    available_sensors: string[];
    available_heaters: string[];
}

class HeatersObject extends PrinterObject<IObject> {

    public readonly name = "heaters";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;

        this.marlinRaker.on("stateChange", (state) => {
            if (state === "ready") {
                this.marlinRaker.printer?.heaterManager.on("availableSensorsUpdate", this.emit.bind(this));
            }
        });
    }

    protected get(): IObject {
        return {
            available_sensors: this.marlinRaker.printer?.heaterManager.availableSensors ?? [],
            available_heaters: this.marlinRaker.printer?.heaterManager.availableHeaters ?? []
        };
    }

    public isAvailable(): boolean {
        return this.marlinRaker.state === "ready";
    }
}

export default HeatersObject;