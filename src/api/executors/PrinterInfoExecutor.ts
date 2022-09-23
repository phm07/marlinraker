import { IMethodExecutor, TSender } from "./IMethodExecutor";
import os from "os";
import { marlinRaker } from "../../Server";
import { TPrinterState } from "../../printer/Printer";

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
            state: marlinRaker.printer?.state ?? "error",
            state_message: marlinRaker.printer?.stateMessage ?? "Cannot connect to serial port",
            hostname: os.hostname(),
            software_version: "1.0",
            cpu_info: ""
        };
    }
}

export default PrinterInfoExecutor;
