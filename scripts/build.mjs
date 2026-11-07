import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { zipSync } from "fflate";

const rootDir = path.resolve(import.meta.dirname, "..");
const distDir = path.join(rootDir, "dist");
const binDir = path.join(rootDir, "node_modules/.bin");
const packageJson = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));
const isFast = process.argv.includes("--fast");
const isZip = process.argv.includes("--zip");

const runBin = (bin, args) => {
    const result = spawnSync(path.join(binDir, bin), args, { cwd: rootDir, stdio: "inherit" });
    if (result.status !== 0) {
        throw new Error(`${bin} exited with status ${result.status}`);
    }
};

const step = async (title, task) => {
    process.stdout.write(`- ${title}\n`);
    await task();
};

const writeDistPackageJson = async () => {
    await writeFile(path.join(distDir, ".version"), packageJson.version);
    await writeFile(path.join(distDir, "package.json"), JSON.stringify({
        name: packageJson.name,
        version: packageJson.version,
        author: packageJson.author,
        main: "index.js",
        license: packageJson.license,
        engines: packageJson.engines,
        scripts: {
            start: "node --enable-source-maps index.js"
        },
        dependencies: packageJson.dependencies
    }, null, 2));
};

const listFiles = async (dir) => {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(entry.parentPath, entry.name));
};

const zipDist = async () => {
    const files = {};
    for (const file of await listFiles(distDir)) {
        files[path.relative(distDir, file)] = await readFile(file);
    }
    const zipped = zipSync(files, { level: 9 });
    await rm(distDir, { recursive: true, force: true });
    await mkdir(distDir, { recursive: true });
    await writeFile(path.join(distDir, "marlinraker.zip"), zipped);
};

try {
    if (!isFast) {
        await step("Linting", () => runBin("eslint", ["src", "test", "--max-warnings=0"]));
    }
    await step("Clearing dist directory", async () => {
        await rm(distDir, { recursive: true, force: true });
        await mkdir(distDir, { recursive: true });
    });
    await step("Static type checking", () => runBin("tsc", ["--noEmit"]));
    await step("Compiling", () => esbuild.build({
        entryPoints: ["src/Server.ts"],
        bundle: true,
        platform: "node",
        target: "node24",
        format: "cjs",
        outfile: "dist/index.js",
        plugins: [nodeExternalsPlugin()],
        minify: true,
        sourcemap: "inline",
        define: {
            "process.env.NODE_ENV": JSON.stringify("production")
        },
        loader: {
            ".toml": "text"
        }
    }));
    await step("Writing package.json", writeDistPackageJson);
    if (isZip) {
        await step("Zipping", zipDist);
    }
    process.stdout.write("Done!\n");
} catch (e) {
    process.stderr.write(`${e instanceof Error ? e.message : e}\n`);
    process.exit(1);
}
