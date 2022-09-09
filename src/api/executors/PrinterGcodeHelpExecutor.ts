import { IMethodExecutor, TSender } from "./IMethodExecutor";

type TResult = Record<string, string>;

class PrinterGcodeHelpExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "printer.gcode.help";

    public invoke(_: TSender, __: undefined): TResult {
        // @TODO
        return {};
    }
}

export default PrinterGcodeHelpExecutor;