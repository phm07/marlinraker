import { IMethodExecutor, TSender } from "./IMethodExecutor";
import MarlinRaker from "../../MarlinRaker";

class PrinterEmergencyStopExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.emergency_stop";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: undefined): string {
        this.marlinRaker.printer?.emergencyStop();
        return "ok";
    }
}

export default PrinterEmergencyStopExecutor;