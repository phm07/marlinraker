import fs from "fs-extra";
import { exec } from "child_process";
import { marlinRaker } from "../Server";
import SimpleNotification from "../api/notifications/SimpleNotification";

interface IThrottledState {
    bits: number;
    flags: string[];
}

class VcgenCmd {

    public readonly throttledState: IThrottledState;
    public readonly isActive: boolean;

    public constructor() {
        this.throttledState = {
            bits: 0,
            flags: []
        };

        this.isActive = fs.existsSync("/usr/bin/vcgencmd");
        if (this.isActive) {
            this.updateThrottledState();
            setInterval(this.updateThrottledState.bind(this), 10000);
        }
    }

    private updateThrottledState(): void {
        exec("vcgencmd get_throttled", (error, stdout) => {
            if (error) return;
            const bits = Number.parseInt(stdout.trim().substring(12), 16) || 0;
            const flags = [];
            if (bits & 1) flags.push("Under-Voltage Detected");
            if (bits & 1 << 1) flags.push("Frequency Capped");
            if (bits & 1 << 2) flags.push("Currently Throttled");
            if (bits & 1 << 3) flags.push("Temperature Limit Active");
            if (bits & 1 << 16) flags.push("Previously Under-Volted");
            if (bits & 1 << 17) flags.push("Previously Frequency Capped");
            if (bits & 1 << 18) flags.push("Previously Throttled");
            if (bits & 1 << 19) flags.push("Previously Temperature Limited");
            if (this.throttledState.bits !== bits) {
                this.throttledState.bits = bits;
                this.throttledState.flags = flags;
                void marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_cpu_throttled", [this.throttledState]));
            }
        });
    }
}

export { IThrottledState };
export default VcgenCmd;