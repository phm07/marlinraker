const fs = require("fs-extra");
const path = require("path");
const packageJson = require("../package.json");

const distDir = path.join(__dirname, "../dist");
fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify({
  name: packageJson.name,
  version: packageJson.version,
  author: packageJson.author,
  main: "index.js",
  license: packageJson.license,
  dependencies: packageJson.dependencies,
  optionalDependencies: packageJson.optionalDependencies
}));

fs.writeFileSync(path.join(distDir, ".version"), packageJson.version);