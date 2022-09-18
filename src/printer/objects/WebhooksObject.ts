import PrinterObject from "./PrinterObject";
import Printer, { TPrinterState } from "../Printer";

interface IObject {
    state: TPrinterState;
    state_message?: string;
}

class WebhooksObject extends PrinterObject<IObject> {

    public readonly name = "webhooks";
    private readonly printer: Printer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;
        this.printer.on("stateChange", this.emit.bind(this));
    }

    public get(_: string[] | null): IObject {
        return {
            state: this.printer.state,
            state_message: this.printer.stateMessage
        };
    }
}

export default WebhooksObject;