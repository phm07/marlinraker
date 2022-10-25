import PrinterObject from "./PrinterObject";
import Printer from "../Printer";
import { marlinRaker } from "../../Server";
import { TPrinterState } from "../../MarlinRaker";

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
        marlinRaker.on("stateChange", this.emit.bind(this));
    }

    public get(_: string[] | null): IObject {
        return {
            state: marlinRaker.state,
            state_message: marlinRaker.stateMessage
        };
    }
}

export default WebhooksObject;