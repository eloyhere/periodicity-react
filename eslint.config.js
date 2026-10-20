import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

// ---------------------------------------------------------------------------
// 代码风格以 ESLint 为唯一标准：
//   1. 变量 / 参数 / 解构必须显式标注类型（包括类型谓词箭头函数）。
//   2. 只用箭头函数；用 `(void 0)`（必须带括号）代替 `undefined`；双引号 + 分号。
//   3. 允许 `(void 0)`、`typeof(target)` 这类显式括号（Prettier 会删除它们，
//      因此不再用 `prettier/prettier` 作为 lint 规则，TS/TSX 也不交给 Prettier）。
//   4. 行宽标准 120（见 .prettierrc.json），不强制行尾（Windows CRLF 合法）。
//   5. 标识符禁止下划线：常量用 PascalCase（NullHash），变量/函数用 camelCase。
// ---------------------------------------------------------------------------

/**
 * `void 0` 必须写成 `(void 0)`。
 * 相邻字符检查已能识别显式分组括号；提供自动修复。
 */
const voidZeroParensRule = {
    meta: {
        type: "suggestion",
        docs: {
            description: "enforce (void 0) instead of void 0",
        },
        fixable: "code",
        schema: [],
        messages: {
            parentheses: "请写成 (void 0)，不要写 void 0。",
        },
    },
    create(context) {
        const sourceText = context.sourceCode.getText();

        return {
            UnaryExpression(node) {
                if (node.operator !== "void") {
                    return;
                }

                if (node.argument.type !== "Literal" || node.argument.value !== 0) {
                    return;
                }

                const before = sourceText[node.range[0] - 1];
                const after = sourceText[node.range[1]];

                if (before === "(" && after === ")") {
                    return;
                }

                context.report({
                    node,
                    messageId: "parentheses",
                    fix(fixer) {
                        return fixer.replaceText(node, "(void 0)");
                    },
                });
            },
        };
    },
};

const periodicityPlugin = {
    rules: {
        "void-zero-parens": voidZeroParensRule,
    },
};

export default defineConfig([
    globalIgnores(["dist", "coverage", "contrast-check.mjs", "lab-check.mjs"]),
    {
        files: ["**/*.{js,mjs,cjs}"],
        extends: [js.configs.recommended, prettierConfig],
        languageOptions: {
            globals: globals.node,
        },
    },
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
            prettierConfig,
        ],
        languageOptions: {
            globals: globals.browser,
        },
        plugins: {
            periodicity: periodicityPlugin,
        },
        rules: {
            // `void 0` 必须写成 `(void 0)`。
            "periodicity/void-zero-parens": "error",

            // 变量、解构和函数参数必须显式标注类型。
            "@typescript-eslint/typedef": [
                "error",
                {
                    arrayDestructuring: true,
                    arrowParameter: true,
                    objectDestructuring: true,
                    parameter: true,
                    variableDeclaration: true,
                    variableDeclarationIgnoreFunction: false,
                },
            ],

            // 每条语句以及函数赋值末尾必须有分号。
            semi: ["error", "always"],

            // 默认双引号；内部含双引号时允许单引号；模板字符串用于拼接/转换。
            quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
            "jsx-quotes": ["error", "prefer-double"],

            // 统一使用箭头函数，禁止 function 声明和 function 表达式。
            "func-style": ["error", "expression", { allowArrowFunctions: true }],
            "prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: false }],

            // 禁止任何标识符使用下划线：常量用 PascalCase（如 NullHash），
            // 变量/函数用 camelCase；不允许 UPPER_SNAKE_CASE、前导或尾随下划线。
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "default",
                    format: ["camelCase", "PascalCase"],
                    // CSS 自定义属性（--ripple-x）与 ARIA 属性（aria-expanded）不是 JS 标识符。
                    filter: { regex: "^(--|aria-)", match: false },
                    leadingUnderscore: "forbid",
                    trailingUnderscore: "forbid",
                },
                {
                    selector: "typeParameter",
                    format: ["PascalCase"],
                    leadingUnderscore: "forbid",
                    trailingUnderscore: "forbid",
                },
                {
                    selector: "import",
                    format: ["camelCase", "PascalCase"],
                    leadingUnderscore: "forbid",
                    trailingUnderscore: "forbid",
                },
            ],

            // 使用 (void 0) 代替 undefined。
            "no-undefined": "error",

            // 字符串拼接使用模板字符串，例如 `${a}${b}`。
            "prefer-template": "error",

            // 允许显式的 (void 0) 与 typeof(target) 括号；不做冗余括号检查。
            "no-extra-parens": "off",

            // 行宽由人工 / Prettier 控制（120），不设为 lint 错误。
            "max-len": "off",

            // 行尾允许 CRLF 或 LF。
            "linebreak-style": "off",

            // 转换为字符串时使用模板字符串，而不是 String() 或 .toString()。
            "no-restricted-syntax": [
                "error",
                {
                    selector: "CallExpression[callee.type='Identifier'][callee.name='String'][arguments.length=1]",
                    message: "请使用模板字符串进行字符串转换，例如 `${value}`。",
                },
                {
                    selector:
                        "CallExpression[callee.type='MemberExpression'][callee.property.type='Identifier'][callee.property.name='toString'][arguments.length=0]",
                    message: "请使用模板字符串进行字符串转换，例如 `${value}`。",
                },
            ],
        },
    },
]);
