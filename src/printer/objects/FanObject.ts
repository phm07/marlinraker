import PrinterObject from "./PrinterObject";
import Printer from "../Printer";

interface IObject {
    speed: number;
    rpm?: number; // @TODO M123?
}

class FanObject extends PrinterObject<IObject> {

    public readonly name = "fan";
    private readonly printer: Printer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;
        this.printer.on("fanSpeedChange", this.emit.bind(this));
    }

    public get(_: string[] | null): IObject {
        return {
            speed: this.printer.fanSpeed
        };
    }
}

export default FanObject;