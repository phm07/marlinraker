import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { move, pathExists } from "../../src/util/FsUtils";

let sameFsDir: string;
let otherFsDir: string;

beforeEach(async () => {
    sameFsDir = await fs.mkdtemp(path.join(os.tmpdir(), "fsutils-"));
    await fs.mkdir(path.join(import.meta.dirname, ".tmp"), { recursive: true });
    otherFsDir = await fs.mkdtemp(path.join(import.meta.dirname, ".tmp", "fsutils-"));
});

afterEach(async () => {
    await fs.rm(sameFsDir, { recursive: true, force: true });
    await fs.rm(otherFsDir, { recursive: true, force: true });
});

describe("pathExists", () => {
    it("is true for an existing file", async () => {
        const file = path.join(sameFsDir, "a.gcode");
        await fs.writeFile(file, "G28");
        assert.equal(await pathExists(file), true);
    });

    it("is false for a missing path", async () => {
        assert.equal(await pathExists(path.join(sameFsDir, "missing")), false);
    });
});

describe("move", () => {
    it("moves a file within the same filesystem", async () => {
        const source = path.join(sameFsDir, "a.gcode");
        const dest = path.join(sameFsDir, "b.gcode");
        await fs.writeFile(source, "G28");

        await move(source, dest);

        assert.equal(await pathExists(source), false);
        assert.equal(await fs.readFile(dest, "utf8"), "G28");
    });

    it("moves a directory across filesystems", async () => {
        const source = path.join(sameFsDir, "dir");
        const dest = path.join(otherFsDir, "dir");
        await fs.mkdir(source);
        await fs.writeFile(path.join(source, "a.gcode"), "G28");

        await move(source, dest);

        assert.equal(await pathExists(source), false);
        assert.equal(await fs.readFile(path.join(dest, "a.gcode"), "utf8"), "G28");
    });

    it("refuses to overwrite an existing destination", async () => {
        const source = path.join(sameFsDir, "a.gcode");
        const dest = path.join(sameFsDir, "b.gcode");
        await fs.writeFile(source, "new");
        await fs.writeFile(dest, "old");

        await assert.rejects(move(source, dest), /dest already exists/);
        assert.equal(await fs.readFile(dest, "utf8"), "old");
        assert.equal(await pathExists(source), true);
    });
});
