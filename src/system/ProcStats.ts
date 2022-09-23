import SystemInfo from "./SystemInfo";
import { procfs } from "@stroncium/procfs";
import os from "os";
import { marlinRaker } from "../Server";
import SimpleNotification from "../api/notifications/SimpleNotification";
import VcgenCmd, { IThrottledState } from "./VcgenCmd";

type TNetworkStats = Record<string, {
    rx_bytes: number;
    tx_bytes: number;
    bandwidth: number;
}>;

type TMoonrakerStats = {
    time: number;
    cpu_usage: number;
    memory: number;
    mem_units: string;
}[];

interface IProcStats {
    moonraker_stats: TMoonrakerStats;
    throttled_state: IThrottledState;
    cpu_temp: number;
    network: TNetworkStats;
    system_cpu_usage: Record<string, number>;
    system_uptime: number;
    websocket_connections: number;
}

interface ICpuStats {
    sum: number;
    idle: number;
}

interface INetStats {
    sum: number;
    time: number;
}

class ProcStats {

    private procStats!: IProcStats;
    private readonly lastCpuStats: Record<string, ICpuStats | undefined>;
    private readonly lastNetStats: Record<string, INetStats | undefined>;
    private readonly moonrakerStats: TMoonrakerStats;
    private readonly vcgenCmd: VcgenCmd;

    public constructor() {
        this.lastCpuStats = {};
        this.lastNetStats = {};
        this.moonrakerStats = [];
        this.vcgenCmd = new VcgenCmd();
        this.updateProcStats(true);
        setInterval(this.updateProcStats.bind(this), 1000);
    }

    private updateProcStats(init = false): void {
        const cpuTemp = ProcStats.getCpuTemp();
        const cpuUsage = this.getCpuUsage();
        const network = this.getNetworkStats();

        this.moonrakerStats.push({
            time: Date.now() / 1000,
            cpu_usage: cpuUsage.cpu || 0,
            memory: Math.round(process.memoryUsage.rss() / 1000),
            mem_units: "kB"
        });
        while (this.moonrakerStats.length > 30) this.moonrakerStats.shift();

        this.procStats = {
            moonraker_stats: this.moonrakerStats,
            throttled_state: this.vcgenCmd.throttledState,
            cpu_temp: cpuTemp,
            network,
            system_cpu_usage: cpuUsage,
            system_uptime: os.uptime(),
            websocket_connections: init ? 0 : marlinRaker.connectionManager.connections.length
        };
        if (!init) void marlinRaker.socketHandler.broadcast(new SimpleNotification("notify_proc_stat_update", [this.procStats]));
    }

    public getProcStats(): IProcStats {
        return {
            ...this.procStats,
            system_uptime: os.uptime(),
            websocket_connections: marlinRaker.connectionManager.connections.length
        };
    }

    private getCpuUsage(): Record<string, number> {
        const usage: Record<string, number> = {};

        const times: Record<string, {
            sum: number;
            idle: number;
        }> = {};

        const cpus = os.cpus();
        let totalSum = 0, totalIdle = 0;
        for (let i = 0; i < cpus.length; i++) {
            const sum = ["user", "nice", "sys", "idle", "irq"]
                .map((key) => (cpus[i].times as Record<string, number>)[key])
                .reduce((a, b) => a + b);
            const idle = cpus[i].times.idle;
            times[`cpu${i}`] = {
                sum,
                idle
            };
            totalSum += sum;
            totalIdle += idle;
        }
        times.cpu = {
            sum: totalSum, idle: totalIdle
        };

        for (const name in times) {
            const last = this.lastCpuStats[name];
            const sum = times[name].sum;
            const idle = times[name].idle;
            if (last) {
                const dSum = sum - last.sum;
                const dIdle = idle - last.idle;
                usage[name] = Math.round((dSum - dIdle) / dSum * 10000) / 100;
            } else {
                usage[name] = 0;
            }
            this.lastCpuStats[name] = times[name];
        }

        return usage;
    }

    private getNetworkStats(): TNetworkStats {

        const stats: TNetworkStats = {};

        try {
            const now = Date.now() / 1000;
            const devices = procfs.netDev();
            for (const device of devices) {
                let bandwidth = 0;
                const lastStats = this.lastNetStats[device.name];
                const sum = device.rxBytes + device.txBytes;
                if (lastStats) {
                    bandwidth = Math.round((sum - lastStats.sum) / (now - lastStats.time) * 100) / 100;
                }
                this.lastNetStats[device.name] = { sum, time: now };
                stats[device.name] = {
                    rx_bytes: device.rxBytes,
                    tx_bytes: device.txBytes,
                    bandwidth
                };
            }
        } catch (_) {
            //
        }

        return stats;
    }

    private static getCpuTemp(): number {
        try {
            const content = SystemInfo.read("/sys/class/thermal/thermal_zone0/temp").trim();
            return Math.round(Number.parseInt(content) / 10) / 100;
        } catch (_) {
            return 0;
        }
    }
}

export { IProcStats };
export default ProcStats;