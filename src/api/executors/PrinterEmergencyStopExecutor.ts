import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class PrinterEmergencyStopExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.emergency_stop";

    public invoke(_: TSender, __: undefined): string {
        marlinRaker.printer?.emergencyStop();
        return "ok";
    }
}

export default PrinterEmergencyStopExecutor;