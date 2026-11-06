import path from "path";

const ROOT_DIRECTORIES = ["gcodes", "config"];

function resolveInRoot(baseDir: string, ...segments: string[]): string {
    const resolved = path.resolve(baseDir, ...segments);
    const root = path.relative(baseDir, resolved).split(path.sep)[0];
    if (!ROOT_DIRECTORIES.includes(root)) {
        throw new Error("Path is outside of the file roots");
    }
    return resolved;
}

function isInRoot(baseDir: string, ...segments: string[]): boolean {
    try {
        resolveInRoot(baseDir, ...segments);
        return true;
    } catch (_) {
        return false;
    }
}

export { resolveInRoot, isInRoot };
