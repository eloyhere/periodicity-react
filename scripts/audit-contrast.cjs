/**
 * WCAG contrast audit for the global theme presets.
 *
 * The script transpiles the TypeScript preset catalogue in memory so it reads
 * the exact tokens shipped by the library, then checks the semantic pairs that
 * carry text, actions, status, focus, and non-text UI affordances.
 */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const colourPattern = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i;

const parseColour = (value) => {
    if (typeof value !== "string") {
        return null;
    }

    const hex = value.trim();
    const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
    const full = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);

    if (short) {
        return [parseInt(short[1] + short[1], 16), parseInt(short[2] + short[2], 16), parseInt(short[3] + short[3], 16), 1];
    }

    if (full) {
        return [parseInt(full[1], 16), parseInt(full[2], 16), parseInt(full[3], 16), 1];
    }

    const rgb = colourPattern.exec(hex);

    return rgb
        ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])]
        : null;
};

const blend = (foreground, background) => {
    const alpha = foreground[3];

    return [
        foreground[0] * alpha + background[0] * (1 - alpha),
        foreground[1] * alpha + background[1] * (1 - alpha),
        foreground[2] * alpha + background[2] * (1 - alpha),
        1,
    ];
};

const channel = (value) => {
    const normalised = value / 255;
    return normalised <= 0.04045 ? normalised / 12.92 : ((normalised + 0.055) / 1.055) ** 2.4;
};

const luminance = (colour) => 0.2126 * channel(colour[0]) + 0.7152 * channel(colour[1]) + 0.0722 * channel(colour[2]);

const ratio = (foreground, background) => {
    const fg = parseColour(foreground);
    const bg = parseColour(background);

    if (fg === null || bg === null) {
        return null;
    }

    const resolvedBg = bg[3] < 1 ? blend(bg, [255, 255, 255, 1]) : bg;
    const resolvedFg = fg[3] < 1 ? blend(fg, resolvedBg) : fg;
    const lighter = Math.max(luminance(resolvedFg), luminance(resolvedBg));
    const darker = Math.min(luminance(resolvedFg), luminance(resolvedBg));

    return (lighter + 0.05) / (darker + 0.05);
};

const loadPresets = () => {
    const sourcePath = path.resolve("src/theme/ThemePresets.ts");
    const source = fs.readFileSync(sourcePath, "utf8");
    const output = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const loaded = new Module(sourcePath, module);
    loaded.filename = sourcePath;
    loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
    loaded._compile(output, sourcePath);

    return loaded.exports.themePresets;
};

const pairs = [
    ["text primary / background", "--colourTextPrimary", "--colourBackground", 4.5],
    ["text primary / surface", "--colourTextPrimary", "--colourSurface", 4.5],
    ["muted text / background", "--colourTextSecond", "--colourBackground", 4.5],
    ["muted text / surface", "--colourTextSecond", "--colourSurface", 4.5],
    ["disabled text / surface", "--colourTextDisabled", "--colourSurface", 3],
    ["primary / background", "--colourPrimary", "--colourBackground", 4.5],
    ["primary / surface", "--colourPrimary", "--colourSurface", 4.5],
    ["on-primary / primary", "--colourOnPrimary", "--colourPrimary", 4.5],
    ["primary container text", "--colourOnPrimaryContainer", "--colourPrimaryContainer", 4.5],
    ["error / surface", "--colourError", "--colourSurface", 4.5],
    ["warning / surface", "--colourWarning", "--colourSurface", 4.5],
    ["success / surface", "--colourSuccess", "--colourSurface", 4.5],
    ["focus ring / surface", "--focus-ring-color", "--colourSurface", 3],
    ["divider / background", "--colourDivider", "--colourBackground", 3],
    ["inverse text / inverse paper", "--colourOnInverse", "--colourInversePaper", 4.5],
    ["inverse muted / inverse paper", "--colourOnInverseMuted", "--colourInversePaper", 4.5],
];

const presets = loadPresets().filter((preset) =>
    ["accessible", "protanopia", "deuteranopia", "tritanopia", "achromatopsia", "accessible-dark"].includes(preset.id),
);
let failures = 0;

console.log("\nWCAG 2.2 contrast audit — accessibility and colour-vision themes\n");

for (const preset of presets) {
    console.log(`${preset.id}  (${preset.label.en}, ${preset.mode})`);

    for (const [label, foregroundKey, backgroundKey, minimum] of pairs) {
        const foreground = preset.tokens[foregroundKey];
        const background = preset.tokens[backgroundKey];
        const value = ratio(foreground, background);
        const pass = value !== null && value >= minimum;

        if (!pass) {
            failures += 1;
        }

        console.log(
            `  ${pass ? "PASS" : "FAIL"}  ${value === null ? "n/a" : value.toFixed(2)}:1  ${minimum}:1  ${label}`,
        );
    }

    console.log("");
}

if (failures > 0) {
    console.error(`Contrast audit failed: ${failures} pair(s) below target.`);
    process.exit(1);
}

console.log("Contrast audit passed for all audited pairs.");
