import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { exec } from "child_process";
import MarlinRaker from "../../MarlinRaker";
import { isRunningInContainer } from "../../system/PowerControl";

class MachineRebootExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "machine.reboot";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: Partial<undefined>): string {
        if (process.env.NODE_ENV !== "production") throw new Error("Cannot reboot in dev mode");
        if (isRunningInContainer()) {
            setTimeout(async () => await this.marlinRaker.restart());
            return "ok";
        }
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