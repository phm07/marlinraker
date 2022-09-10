const zipper = require("zip-local");
const path = require("path");
const fs = require("fs-extra");

const inPath = path.join(__dirname, "../dist/");
const outDir = path.join(__dirname, "../dist/");
const outPath = path.join(outDir, "marlinraker.zip");
zipper.sync.zip(inPath).compress().save(outPath);

const files = fs.readdirSync(outDir);
for(const file of files) {
    const filepath = path.join(outDir, file);
    if(path.relative(outPath, filepath)) {
        fs.removeSync(filepath);
    }
}