import fs from "fs";

interface INetDevice {
    name: string;
    rxBytes: number;
    txBytes: number;
}

const NET_DEV_HEADER_LINES = 2;
const RX_BYTES_FIELD = 0;
const TX_BYTES_FIELD = 8;
const BYTES_PER_KB = 1024;

function parseNetDev(content: string): INetDevice[] {
    return content.split("\n")
        .slice(NET_DEV_HEADER_LINES)
        .filter((line) => line.includes(":"))
        .map((line) => {
            const [name, counters] = line.split(":");
            const fields = counters.trim().split(/\s+/).map(Number);
            return {
                name: name.trim(),
                rxBytes: fields[RX_BYTES_FIELD],
                txBytes: fields[TX_BYTES_FIELD]
            };
        });
}

function parseMemAvailable(content: string): number | undefined {
    const match = /^MemAvailable:\s+(\d+)\s+kB$/m.exec(content);
    return match ? Number(match[1]) * BYTES_PER_KB : undefined;
}

function readNetDev(): INetDevice[] {
    return parseNetDev(fs.readFileSync("/proc/net/dev", "utf8"));
}

function readMemAvailable(): number | undefined {
    return parseMemAvailable(fs.readFileSync("/proc/meminfo", "utf8"));
}

export { INetDevice, parseNetDev, parseMemAvailable, readNetDev, readMemAvailable };
