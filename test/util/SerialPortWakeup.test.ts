import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "events";
import { SerialPort } from "serialport";
import { wakeEventLoopOnSerialEvents } from "../../src/util/SerialPortWakeup";

describe("wakeEventLoopOnSerialEvents", () => {
    it("still delivers poller events and schedules a macrotask after each one", () => {
        const poller = new EventEmitter();
        const immediate = mock.method(globalThis, "setImmediate");
        try {
            wakeEventLoopOnSerialEvents({ port: { poller } } as unknown as SerialPort);
            let readable = 0;
            poller.on("readable", () => readable++);

            assert.equal(poller.emit("readable"), true);
            poller.emit("writable");

            assert.equal(readable, 1);
            assert.equal(immediate.mock.callCount(), 2);
        } finally {
            immediate.mock.restore();
        }
    });

    it("leaves ports without a poller alone", () => {
        assert.doesNotThrow(() => wakeEventLoopOnSerialEvents({ port: {} } as unknown as SerialPort));
        assert.doesNotThrow(() => wakeEventLoopOnSerialEvents({} as unknown as SerialPort));
    });
});
