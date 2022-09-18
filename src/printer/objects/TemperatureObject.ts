import PrinterObject from "./PrinterObject";

interface IObject {
    temperature?: number;
    target?: number;
    power?: number;
}

class HeaterObject extends PrinterObject<IObject> {

    public readonly name: string;
    public temp?: number;
    public target?: number;
    public power?: number;

    public constructor(name: string) {
        super();
        this.name = name;
    }

    public get(_: string[] | null): IObject {
        return {
            temperature: this.temp,
            power: this.power,
            target: this.target
        };
    }
}

export default HeaterObject;