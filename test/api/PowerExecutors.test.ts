import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import MachineShutdownExecutor from "../../src/api/executors/MachineShutdownExecutor";
import MachineRebootExecutor from "../../src/api/executors/MachineRebootExecutor";
import MarlinRaker from "../../src/MarlinRaker";
import { isRunningInContainer } from "../../src/system/PowerControl";

class FakeMarlinRaker {
    public readonly calls: string[] = [];

    public async shutdownGracefully(): Promise<void> {
        this.calls.push("shutdown");
    }

    public async restart(): Promise<void> {
        this.calls.push("restart");
    }
}

const nextTick = async (): Promise<void> => new Promise((resolve) => setTimeout(resolve));
const originalEnv = { ...process.env };
let fake: FakeMarlinRaker;

beforeEach(() => {
    process.env.NODE_ENV = "production";
    process.env.MARLINRAKER_CONTAINER = "true";
    fake = new FakeMarlinRaker();
});

afterEach(() => {
    process.env = { ...originalEnv };
});

describe("isRunningInContainer", () => {
    it("is true only when MARLINRAKER_CONTAINER is true", () => {
        assert.equal(isRunningInContainer({ MARLINRAKER_CONTAINER: "true" }), true);
        assert.equal(isRunningInContainer({ MARLINRAKER_CONTAINER: "false" }), false);
        assert.equal(isRunningInContainer({}), false);
    });
});

describe("power actions in a container", () => {
    it("machine.shutdown stops Marlinraker, which stops the container", async () => {
        const result = new MachineShutdownExecutor(fake as unknown as MarlinRaker).invoke(undefined as never, undefined);
        await nextTick();

        assert.equal(result, "ok");
        assert.deepEqual(fake.calls, ["shutdown"]);
    });

    it("machine.reboot restarts Marlinraker", async () => {
        const result = new MachineRebootExecutor(fake as unknown as MarlinRaker).invoke(undefined as never, undefined);
        await nextTick();

        assert.equal(result, "ok");
        assert.deepEqual(fake.calls, ["restart"]);
    });
});
