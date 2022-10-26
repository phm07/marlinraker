import { IMethodExecutor, TSender } from "./IMethodExecutor";
import os from "os";
import MarlinRaker, { TPrinterState } from "../../MarlinRaker";

interface IResult {
    state: TPrinterState;
    state_message?: string;
    hostname: string;
    software_version: string;
    cpu_info: string;
}

class PrinterInfoExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "printer.info";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public async invoke(_: TSender, __: undefined): Promise<IResult> {
        return {
            state: this.marlinRaker.state,
            state_message: this.marlinRaker.stateMessage,
            hostname: os.hostname(),
            software_version: "1.0",
            cpu_info: ""
        };
    }
}

export default PrinterInfoExecutor;
