import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createReadStream } from "fs";
import fs from "fs/promises";
import os from "os";
import path from "path";
import LineReader from "../../src/files/LineReader";

let dir: string;

beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "linereader-"));
});

afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
});

const readAll = async (lineCount: number): Promise<(string | null)[]> => {
    const file = path.join(dir, "print.gcode");
    await fs.writeFile(file, Array.from({ length: lineCount }, (_, i) => `G1 X${i}`).join("\n") + "\n");
    const reader = new LineReader(createReadStream(file));
    const lines: (string | null)[] = [await reader.readLine()];
    await new Promise((resolve) => setTimeout(resolve, 50));
    let line: string | null;
    do {
        line = await reader.readLine();
        lines.push(line);
    } while (line !== null);
    return lines;
};

describe("LineReader", () => {
    it("keeps reading buffered lines after the file stream has closed", async () => {
        const lines = await readAll(400);
        assert.equal(lines.length, 401);
        assert.equal(lines[0], "G1 X0");
        assert.equal(lines[399], "G1 X399");
        assert.equal(lines[400], null);
    });

    it("reads a file larger than its buffer to the end, one line at a time", async () => {
        const lines = await readAll(5000);
        assert.equal(lines.length, 5001);
        assert.equal(lines[4999], "G1 X4999");
        assert.equal(lines[5000], null);
    });
});
