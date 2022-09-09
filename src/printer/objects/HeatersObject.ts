import PrinterObject from "./PrinterObject";

type TObject = {
    available_sensors: string[];
    available_heaters: string[];
};

class HeatersObject extends PrinterObject<TObject> {

    public readonly name = "heaters";
    public available_sensors: string[];
    public available_heaters: string[];

    public constructor() {
        super();
        this.available_sensors = [];
        this.available_heaters = [];
    }

    public get(_: string[] | null): TObject {
        return {
            available_sensors: this.available_sensors,
            available_heaters: this.available_heaters
        };
    }
}

export default HeatersObject;