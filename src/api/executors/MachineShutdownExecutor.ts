import { IMethodExecutor, TSender } from "./IMethodExecutor";
import { exec } from "child_process";
import MarlinRaker from "../../MarlinRaker";
import { isRunningInContainer } from "../../system/PowerControl";

class MachineShutdownExecutor implements IMethodExecutor<undefined, string> {

    public readonly name = "machine.shutdown";
    public readonly httpMethod = "post";
    private readonly marlinRaker: MarlinRaker;

    public constructor(marlinRaker: MarlinRaker) {
        this.marlinRaker = marlinRaker;
    }

    public invoke(_: TSender, __: Partial<undefined>): string {
        if (process.env.NODE_ENV !== "production") throw new Error("Cannot shutdown in dev mode");
        if (isRunningInContainer()) {
            setTimeout(async () => await this.marlinRaker.shutdownGracefully());
            return "ok";
        }
        if (process.platform === "linux" || process.platform === "darwin") {
            setTimeout(() => exec("sudo shutdown -h now"));
        } else if (process.platform === "win32") {
            setTimeout(() => exec("shutdown /s"));
        } else {
            throw new Error(`Unsupported platform ${process.platform}`);
        }
        return "ok";
    }
}

export default MachineShutdownExecutor;