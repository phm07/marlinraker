import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { exec } from "child_process";

class MachineRebootExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "machine.reboot";
    public readonly httpMethod = "post";

    public invoke(_: TSender, __: Partial<undefined>): string {
        if (process.env.NODE_ENV !== "production") throw new Error("Cannot reboot in dev mode");
        if (process.platform === "linux" || process.platform === "darwin") {
            exec("sudo shutdown -r now");
        } else if (process.platform === "win32") {
            exec("shutdown /r");
        } else {
            throw new Error(`Unsupported platform ${process.platform}`);
        }
        return "ok";
    }
}

export default MachineRebootExecutor;