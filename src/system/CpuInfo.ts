import { execSync } from "child_process";
import SystemInfo from "./SystemInfo";
import os from "os";

interface ICpuInfo {
    cpu_count: number;
    bits: string;
    processor: string;
    cpu_desc: string;
    serial_number: string;
    hardware_desc: string;
    model: string;
    total_memory: number;
    memory_units: string;
}

class CpuInfo {

    public static getCpuInfo(): ICpuInfo {
        const cpus = os.cpus();
        const model = cpus[0].model;
        const cpuCount = cpus.length;
        let serial = "", hardware = "", cpuDesc = "", architecture = "", bits;

        try {
            const content = SystemInfo.read("/proc/cpuinfo");
            for (const line of content.split(/\r?\n/)) {
                if (line.startsWith("Serial")) {
                    serial = /^Serial\s+: 0*([0-9a-f]+)$/.exec(line)?.[1] ?? serial;
                } else if (line.startsWith("Hardware")) {
                    hardware = /^Hardware\s+: (.+)$/.exec(line)?.[1] ?? hardware;
                } else if (line.startsWith("model name")) {
                    cpuDesc = /^model name\s+: (.+)$/.exec(line)?.[1] ?? cpuDesc;
                }
            }

            bits = `${Number.parseInt(execSync("getconf LONG_BIT").toString("utf-8").trim()) || 32}bit`;
            architecture = execSync("uname -m").toString("utf-8").trim();
        } catch (_) {
            bits = ["arm64", "ppc64", "x64", "s390x"].includes(os.arch()) ? "64bit" : "32bit";
        }

        return {
            cpu_count: cpuCount,
            bits,
            processor: architecture,
            cpu_desc: cpuDesc,
            serial_number: serial,
            hardware_desc: hardware,
            model,
            total_memory: Math.round(os.totalmem() / 1000),
            memory_units: "kB"
        };
    }
}

export { ICpuInfo };
export default CpuInfo;