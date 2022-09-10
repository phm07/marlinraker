import PrinterObject from "./PrinterObject";
import Printer from "../Printer";

type TObject = {
    speed: number;
    rpm?: number; // @TODO M123?
};

class FanObject extends PrinterObject<TObject> {

    public readonly name = "fan";
    private readonly printer: Printer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;
        this.printer.on("fanSpeedChange", this.emit.bind(this));
    }

    protected get(_: string[] | null): TObject {
        return {
            speed: this.printer.fanSpeed
        };
    }
}

export default FanObject;