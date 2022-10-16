import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { exec } from "child_process";

class MachineShutdownExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "machine.shutdown";
    public readonly httpMethod = "post";

    public invoke(_: TSender, __: Partial<undefined>): string {
        if (process.env.NODE_ENV !== "production") throw new Error("Cannot shutdown in dev mode");
        if (process.platform === "linux" || process.platform === "darwin") {
            exec("sudo shutdown -h now");
        } else if (process.platform === "win32") {
            exec("shutdown /s");
        } else {
            throw new Error(`Unsupported platform ${process.platform}`);
        }
        return "ok";
    }
}

export default MachineShutdownExecutor;