/* eslint-disable */
/**
 * Built-in locale integrity audit.
 *
 * Every shipped locale must expose the complete common-message key set with no
 * empty values, and non-English locales must translate the core vocabulary
 * rather than silently falling back to English.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve("src/international/builtInMessages.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const blocks = [...source.matchAll(/const (\w+Messages): CommonMessages = \{([\s\S]*?)\n\};/g)];
const entries = (body) => [
    ...body.matchAll(/^\s{4}(\w+):\s*"((?:[^"\\]|\\.)*)",/gm),
];

if (blocks.length !== 12) {
    throw new Error(`Expected 12 built-in dictionaries, found ${blocks.length}.`);
}

const dictionaries = blocks.map(([, name, body]) => {
    const values = Object.fromEntries(entries(body).map(([, key, value]) => [key, value]));
    return { name, values };
});
const reference = dictionaries[0].values;
const referenceKeys = Object.keys(reference);
const failures = [];

for (const { name, values } of dictionaries) {
    const keys = Object.keys(values);
    const missing = referenceKeys.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !referenceKeys.includes(key));
    const empty = keys.filter((key) => values[key].trim().length === 0);
    const core = ["close", "cancel", "save", "search", "loading", "warning", "success"];
    const untranslated =
        name === "enGbMessages" || name === "enUsMessages"
            ? []
            : core.filter((key) => values[key] === reference[key]);

    if (missing.length > 0 || extra.length > 0 || empty.length > 0 || untranslated.length > 0) {
        failures.push({ name, missing, extra, empty, untranslated });
    }

    console.log(
        `${name}: ${keys.length} keys, missing ${missing.length}, empty ${empty.length}, untranslated core ${untranslated.length}`,
    );
}

if (failures.length > 0) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
}

console.log("Locale audit passed: every built-in dictionary is complete and translated.");
