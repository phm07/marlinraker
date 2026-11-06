import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import WebcamManager, { IWebcam, IWebcamStore } from "../../src/webcams/WebcamManager";

class MemoryStore implements IWebcamStore {
    public readonly data: Record<string, Record<string, unknown> | undefined> = {};

    public async getItem(namespace: string, key?: string): Promise<unknown> {
        const values = this.data[namespace];
        if (!values) return null;
        return key ? values[key] ?? null : values;
    }

    public async addItem(namespace: string, key: string, value: unknown): Promise<unknown> {
        const values = this.data[namespace] ?? {};
        values[key] = value;
        this.data[namespace] = values;
        return value;
    }

    public async deleteItem(namespace: string, key: string): Promise<unknown> {
        const value = this.data[namespace]?.[key] ?? null;
        delete this.data[namespace]?.[key];
        return value;
    }
}

let store: MemoryStore;
let notified: IWebcam[][];
let manager: WebcamManager;

beforeEach(() => {
    store = new MemoryStore();
    notified = [];
    manager = new WebcamManager(store, async (webcams) => {
        notified.push(webcams);
    });
});

describe("WebcamManager.list", () => {
    it("is empty without saved webcams", async () => {
        assert.deepEqual(await manager.list(), []);
    });
});

describe("WebcamManager.save", () => {
    it("creates a webcam with Moonraker defaults", async () => {
        const webcam = await manager.save({ name: "door", stream_url: "/webcam/?action=stream" });

        assert.equal(webcam.name, "door");
        assert.equal(webcam.stream_url, "/webcam/?action=stream");
        assert.equal(webcam.service, "mjpegstreamer");
        assert.equal(webcam.enabled, true);
        assert.equal(webcam.target_fps, 15);
        assert.equal(webcam.rotation, 0);
        assert.equal(webcam.source, "database");
        assert.match(webcam.uid, /^[0-9a-f-]{36}$/);
        assert.deepEqual(await manager.list(), [webcam]);
        assert.deepEqual(notified, [[webcam]]);
    });

    it("updates the webcam with the same name instead of adding one", async () => {
        const created = await manager.save({ name: "door", stream_url: "/a" });
        const updated = await manager.save({ name: "door", stream_url: "/b", rotation: 90 });

        assert.equal(updated.uid, created.uid);
        assert.equal(updated.stream_url, "/b");
        assert.equal(updated.rotation, 90);
        assert.equal((await manager.list()).length, 1);
    });

    it("renames a webcam addressed by uid", async () => {
        const created = await manager.save({ name: "door", stream_url: "/a" });
        const renamed = await manager.save({ uid: created.uid, name: "nozzle" });

        assert.equal(renamed.uid, created.uid);
        assert.equal(renamed.name, "nozzle");
        assert.equal(renamed.stream_url, "/a");
    });

    it("converts the strings of HTTP query parameters", async () => {
        const webcam = await manager.save({ name: "door", enabled: "false", target_fps: "20", flip_vertical: "true" });

        assert.equal(webcam.enabled, false);
        assert.equal(webcam.target_fps, 20);
        assert.equal(webcam.flip_vertical, true);
    });

    it("requires a name", async () => {
        await assert.rejects(manager.save({ stream_url: "/a" }), /name/);
    });
});

describe("WebcamManager.get", () => {
    it("finds a webcam by name or uid", async () => {
        const webcam = await manager.save({ name: "door" });

        assert.deepEqual(await manager.get({ name: "door" }), webcam);
        assert.deepEqual(await manager.get({ uid: webcam.uid }), webcam);
    });

    it("returns null for an unknown webcam", async () => {
        assert.equal(await manager.get({ name: "missing" }), null);
    });
});

describe("WebcamManager.delete", () => {
    it("removes the webcam and notifies the new list", async () => {
        const webcam = await manager.save({ name: "door" });

        assert.deepEqual(await manager.delete({ name: "door" }), webcam);
        assert.deepEqual(await manager.list(), []);
        assert.deepEqual(notified.at(-1), []);
    });

    it("rejects an unknown webcam", async () => {
        await assert.rejects(manager.delete({ name: "missing" }), /not found/);
    });
});
