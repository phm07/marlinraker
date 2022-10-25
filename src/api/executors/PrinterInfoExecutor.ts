import { IMethodExecutor, TSender } from "./IMethodExecutor";
import os from "os";
import { marlinRaker } from "../../Server";
import { TPrinterState } from "../../MarlinRaker";

interface IResult {
    state: TPrinterState;
    state_message?: string;
    hostname: string;
    software_version: string;
    cpu_info: string;
}

class PrinterInfoExecutor implements IMethodExecutor<undefined, IResult> {

    public readonly name = "printer.info";

    public async invoke(_: TSender, __: undefined): Promise<IResult> {
        return {
            state: marlinRaker.state,
            state_message: marlinRaker.stateMessage,
            hostname: os.hostname(),
            software_version: "1.0",
            cpu_info: ""
        };
    }
}

export default PrinterInfoExecutor;
