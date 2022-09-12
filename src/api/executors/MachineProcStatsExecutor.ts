import { IMethodExecutor, TSender } from "./IMethodExecutor";
import si from "systeminformation";
import { marlinRaker } from "../../Server";

type TNetworkInfo = {
    rx_bytes: number,
    tx_bytes: number,
    bandwidth: number
};

type TResult = {
    moonraker_stats: {
        time: number,
        cpu_usage: number,
        memory: number,
        mem_units: string
    },
    cpu_temp: number,
    network: Record<string, TNetworkInfo>,
    system_cpu_usage: Record<string, number>,
    websocket_connections: number
};

class MachineProcStatsExecutor implements IMethodExecutor<undefined, TResult> {

    public readonly name = "machine.proc_stats";
    public readonly timeout = 30000;

    public async invoke(_: TSender, __: undefined): Promise<TResult> {
        const cpuTemp = await si.cpuTemperature();
        const load = await si.currentLoad();
        const memory = await si.mem();
        const interfaces = await si.networkInterfaces();
        const networkStats = await si.networkStats(interfaces.map((i) => i.iface).join(","));
        return {
            moonraker_stats: {
                time: Date.now() / 1000,
                cpu_usage: load.currentLoad,
                memory: memory.used / 1000,
                mem_units: "kB"
            },
            cpu_temp: cpuTemp.main,
            network: Object.fromEntries(interfaces.map((interfaceData, index) => [
                interfaceData.iface,
                {
                    rx_bytes: networkStats[index].rx_bytes,
                    tx_bytes: networkStats[index].tx_bytes,
                    bandwidth: networkStats[index].tx_sec + networkStats[index].rx_sec
                }
            ])),
            system_cpu_usage: Object.fromEntries(load.cpus.map((cpu, index) => [
                "cpu" + index,
                cpu.load
            ])),
            websocket_connections: marlinRaker.connectionManager.connections.length
        };
    }
}

export default MachineProcStatsExecutor;