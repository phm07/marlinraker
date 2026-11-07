import PrinterObject from "./PrinterObject";
import os from "os";
import { readMemAvailable } from "../../system/ProcFs";

interface IObject {
    sysload: number;
    cputime: number;
    memavail: number;
}

class SystemStatsObject extends PrinterObject<IObject> {

    public readonly name = "system_stats";

    public constructor() {
        super();
        setInterval(this.emit.bind(this), 1000);
    }

    protected get(): IObject {
        const cpuUsage = process.cpuUsage();
        return {
            sysload: os.loadavg()[0],
            cputime: (cpuUsage.user + cpuUsage.system) / 1e6,
            memavail: SystemStatsObject.getMemAvail() / 1000
        };
    }

    private static getMemAvail(): number {
        try {
            return readMemAvailable() ?? os.freemem();
        } catch {
            return os.freemem();
        }
    }
}

export default SystemStatsObject;