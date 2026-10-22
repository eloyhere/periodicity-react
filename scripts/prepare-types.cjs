const fs = require("node:fs");
const path = require("node:path");

const outDir = path.resolve("dist/types");
const shimPath = path.join(outDir, "css.d.ts");
const entryPath = path.join(outDir, "library.d.ts");
const reference = '/// <reference path="./css.d.ts" />\n';

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(shimPath, 'declare module "*.css";\n', "utf8");

const entry = fs.readFileSync(entryPath, "utf8");

if (!entry.startsWith(reference)) {
    fs.writeFileSync(entryPath, reference + entry, "utf8");
}
