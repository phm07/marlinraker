import fs from "fs/promises";

async function pathExists(filepath: string): Promise<boolean> {
    try {
        await fs.access(filepath);
        return true;
    } catch {
        return false;
    }
}

function isCrossDeviceError(e: unknown): boolean {
    return (e as NodeJS.ErrnoException).code === "EXDEV";
}

async function move(source: string, dest: string): Promise<void> {
    if (await pathExists(dest)) {
        throw new Error("dest already exists.");
    }
    try {
        await fs.rename(source, dest);
    } catch (e) {
        if (!isCrossDeviceError(e)) throw e;
        await fs.cp(source, dest, { recursive: true, errorOnExist: true, force: false });
        await fs.rm(source, { recursive: true, force: true });
    }
}

export { pathExists, move };
