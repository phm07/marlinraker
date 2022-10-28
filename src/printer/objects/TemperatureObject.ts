import PrinterObject from "./PrinterObject";

interface IObject {
    temperature: number;
    target?: number;
    power?: number;
    measured_min_temp?: number;
    measured_max_temp?: number;
}

class TemperatureObject extends PrinterObject<IObject> {

    public readonly name: string;
    public temp: number;
    public target?: number;
    public power?: number;
    public minTemp?: number;
    public maxTemp?: number;

    public constructor(name: string) {
        super();
        this.temp = 0;
        this.name = name;
    }

    protected get(): IObject {
        return {
            temperature: this.temp,
            power: this.power,
            target: this.target,
            measured_min_temp: this.minTemp,
            measured_max_temp: this.maxTemp
        };
    }
}

export default TemperatureObject;