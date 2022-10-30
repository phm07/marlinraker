const zipper = require("zip-local");
const esbuild = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");
const fs = require("fs-extra");
const { Listr } = require("listr2");
const path = require("path");
const packageJson = require("../package.json");

const copyPackageJson = async () => {
    const distDir = path.join(__dirname, "../dist");
    await fs.writeFile(path.join(distDir, ".version"), packageJson.version);
    await fs.writeFile(path.join(distDir, "package.json"), JSON.stringify({
        name: packageJson.name,
        version: packageJson.version,
        author: packageJson.author,
        main: "index.js",
        license: packageJson.license,
        scripts: {
            start: "node index.js"
        },
        dependencies: packageJson.dependencies,
        optionalDependencies: packageJson.optionalDependencies
    }));
};

const zip = () => {

    const inPath = path.join(__dirname, "../dist/");
    const outDir = path.join(__dirname, "../dist/");
    const outPath = path.join(outDir, "marlinraker.zip");

    return new Promise((resolve, reject) => {
        zipper.zip(inPath, (error, zipped) => {
            if (error) {
                reject(error);
                return;
            }
            fs.emptyDir(outDir).then(() => {
                zipped.compress();
                zipped.save(outPath, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        });
    });
};

(async () => {

    const { execa } = await import("execa");

    const tasks = new Listr([
        {
            title: "Linting",
            task: () => execa("eslint", ["src", "--fix", "--max-warnings=0"])
        },
        {
            title: "Clearing dist directory",
            task: () => fs.emptyDir("dist/")
        },
        {
            title: "Static type checking",
            task: () => execa("tsc", ["--noEmit"])
        },
        {
            title: "Compiling",
            task: () => esbuild.build({
                entryPoints: ["src/Server.ts"],
                bundle: true,
                platform: "node",
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
            })
        },
        {
            title: "Copy package.json",
            task: () => copyPackageJson()
        },
        {
            title: "Zipping",
            enabled: _ => process.argv.includes("--zip"),
            task: () => zip()
        }
    ]);

    try {
        await tasks.run();
        console.log("Done!");
    } catch (e) {
        process.exit(1);
    }

})();
