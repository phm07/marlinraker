import PrinterObject from "./PrinterObject";
import Printer, { TPrinterState } from "../Printer";

type TObject = {
    state: TPrinterState,
    state_message?: string
};

class WebhooksObject extends PrinterObject<TObject> {

    public readonly name = "webhooks";
    private readonly printer: Printer;

    public constructor(printer: Printer) {
        super();
        this.printer = printer;
        this.printer.on("stateChange", this.emit.bind(this));
    }

    public get(_: string[] | null): TObject {
        return {
            state: this.printer.state,
            state_message: this.printer.stateMessage
        };
    }
}

export default WebhooksObject;