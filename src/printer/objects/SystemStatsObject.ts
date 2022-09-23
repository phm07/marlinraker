import PrinterObject from "./PrinterObject";
import os from "os";
import { procfs } from "@stroncium/procfs";

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

    protected get(_: string[] | null): IObject {
        const cpuUsage = process.cpuUsage();
        return {
            sysload: os.loadavg()[0],
            cputime: (cpuUsage.system + cpuUsage.system) / 1e6,
            memavail: SystemStatsObject.getMemAvail() / 1000
        };
    }

    private static getMemAvail(): number {
        try {
            return procfs.meminfo().available;
        } catch (e) {
            return os.freemem();
        }
    }
}

export default SystemStatsObject;