import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { marlinRaker } from "../../Server";

class PrinterFirmwareRestartExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "printer.firmware_restart";

    public async invoke(_: TSender, __: undefined): Promise<string> {
        await marlinRaker.reconnect();
        return "ok";
    }
}

export default PrinterFirmwareRestartExecutor;