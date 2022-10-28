import PrinterObject from "./PrinterObject";
import MarlinRaker, { TPrinterState } from "../../MarlinRaker";

interface IObject {
    state: TPrinterState;
    state_message?: string;
}

class WebhooksObject extends PrinterObject<IObject> {

    public readonly name = "webhooks";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        super();
        this.marlinRaker = marlinRaker;
        this.marlinRaker.on("stateChange", this.emit.bind(this));
    }

    protected get(): IObject {
        return {
            state: this.marlinRaker.state,
            state_message: this.marlinRaker.stateMessage
        };
    }
}

export default WebhooksObject;