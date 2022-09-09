import PrinterObject from "./PrinterObject";

type TObject = {
    temperature?: number,
    target?: number,
    power?: number
};

class HeaterObject extends PrinterObject<TObject> {

    public readonly name: string;
    public temp?: number;
    public target?: number;
    public power?: number;

    public constructor(name: string) {
        super();
        this.name = name;
    }

    public get(_: string[] | null): TObject {
        return {
            temperature: this.temp,
            power: this.power,
            target: this.target
        };
    }
}

export default HeaterObject;