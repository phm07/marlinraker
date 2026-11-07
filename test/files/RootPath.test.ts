import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { isInRoot, resolveInRoot } from "../../src/files/RootPath";

const BASE_DIR = path.resolve("/srv/marlinraker_files");

describe("resolveInRoot", () => {
    it("resolves a file inside gcodes", () => {
        assert.equal(resolveInRoot(BASE_DIR, "gcodes", "sub", "part.gcode"), path.join(BASE_DIR, "gcodes/sub/part.gcode"));
    });

    it("resolves a root directory itself", () => {
        assert.equal(resolveInRoot(BASE_DIR, "config"), path.join(BASE_DIR, "config"));
    });

    it("allows moving between roots inside the base directory", () => {
        assert.equal(resolveInRoot(BASE_DIR, "gcodes/../config/printer.toml"), path.join(BASE_DIR, "config/printer.toml"));
    });

    it("rejects paths that climb out of the roots", () => {
        assert.throws(() => resolveInRoot(BASE_DIR, "gcodes", "../../etc/passwd"), /outside of the file roots/);
    });

    it("rejects the base directory itself", () => {
        assert.throws(() => resolveInRoot(BASE_DIR, "gcodes/.."), /outside of the file roots/);
    });

    it("rejects unknown roots", () => {
        assert.throws(() => resolveInRoot(BASE_DIR, "logs", "marlinraker.log"), /outside of the file roots/);
    });

    it("rejects absolute paths outside the base directory", () => {
        assert.throws(() => resolveInRoot(BASE_DIR, "gcodes", "/etc/passwd"), /outside of the file roots/);
    });
});

describe("isInRoot", () => {
    it("is true inside a root", () => {
        assert.equal(isInRoot(BASE_DIR, "gcodes/part.gcode"), true);
    });

    it("is false outside the roots", () => {
        assert.equal(isInRoot(BASE_DIR, "gcodes/../../etc"), false);
    });
});
