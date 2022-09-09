import EventEmitter from "events";

type TState = "standby" | "printing" | "paused" | "complete" | "cancelled" | "error";

abstract class PrintJob extends EventEmitter {

    public readonly abstract filename: string;
    public abstract filePosition: number;
    public abstract progress: number;
    public state: TState;

    protected constructor() {
        super();
        this.state = "standby";
    }

    public abstract start(): Promise<void>;
    public abstract pause(): Promise<void>;
    public abstract resume(): Promise<void>;
    public abstract cancel(): Promise<void>;

    public setState(state: TState): void {
        this.state = state;
        this.emit("stateChange", state);
    }
}

export { TState };
export default PrintJob;