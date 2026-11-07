import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMemAvailable, parseNetDev } from "../../src/system/ProcFs";

const NET_DEV = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo:  123456     100    0    0    0     0          0         0   123456     100    0    0    0     0       0          0
  eth0: 9876543    5000    0    0    0     0          0        12  1234567    4000    0    0    0     0       0          0
`;

const MEMINFO = `MemTotal:       16303100 kB
MemFree:         1234567 kB
MemAvailable:   13699008 kB
Buffers:          123456 kB
`;

describe("parseNetDev", () => {
    it("returns rx and tx bytes for every interface", () => {
        assert.deepEqual(parseNetDev(NET_DEV), [
            { name: "lo", rxBytes: 123456, txBytes: 123456 },
            { name: "eth0", rxBytes: 9876543, txBytes: 1234567 }
        ]);
    });

    it("returns an empty list when there are no interfaces", () => {
        assert.deepEqual(parseNetDev(NET_DEV.split("\n").slice(0, 2).join("\n")), []);
    });
});

describe("parseMemAvailable", () => {
    it("returns MemAvailable in bytes", () => {
        assert.equal(parseMemAvailable(MEMINFO), 13699008 * 1024);
    });

    it("returns undefined when MemAvailable is missing", () => {
        assert.equal(parseMemAvailable("MemTotal: 16303100 kB\n"), undefined);
    });
});
