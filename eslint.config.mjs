import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist/", "node_modules/", "scripts/", "marlinraker_files/"]
    },
    js.configs.recommended,
    tseslint.configs.strict,
    {
        files: ["**/*.ts"],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        plugins: {
            "@stylistic": stylistic
        },
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_"
            }],
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/consistent-indexed-object-style": "warn",
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/explicit-member-accessibility": "warn",
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/no-shadow": "warn",
            "@typescript-eslint/no-unnecessary-condition": "warn",
            "@typescript-eslint/no-unnecessary-qualifier": "warn",
            "@typescript-eslint/no-unsafe-declaration-merging": "off",
            "@typescript-eslint/prefer-for-of": "warn",
            "@typescript-eslint/no-floating-promises": ["error", {
                ignoreVoid: true,
                allowForKnownSafeCalls: [{ from: "package", package: "node:test", name: ["describe", "it"] }]
            }],
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/prefer-nullish-coalescing": "off",
            "@typescript-eslint/prefer-readonly": "warn",
            "@typescript-eslint/promise-function-async": "warn",
            "eqeqeq": "warn",
            "no-console": "error",
            "no-implicit-coercion": "warn",
            "no-lonely-if": "warn",
            "prefer-exponentiation-operator": "warn",
            "@stylistic/quotes": ["warn", "double"],
            "@stylistic/semi": ["warn", "always"],
            "@stylistic/indent": ["warn", 4, { SwitchCase: 0 }],
            "@stylistic/brace-style": "warn",
            "@stylistic/comma-dangle": "warn",
            "@stylistic/comma-spacing": "warn",
            "@stylistic/function-call-spacing": "warn",
            "@stylistic/keyword-spacing": "warn",
            "@stylistic/no-extra-parens": "warn",
            "@stylistic/no-extra-semi": "warn",
            "@stylistic/object-curly-spacing": ["warn", "always"],
            "@stylistic/member-delimiter-style": "warn",
            "@stylistic/space-infix-ops": "warn",
            "@stylistic/type-annotation-spacing": "warn",
            "@stylistic/array-bracket-spacing": "warn",
            "@stylistic/arrow-parens": "warn",
            "@stylistic/arrow-spacing": "warn",
            "@stylistic/block-spacing": "warn",
            "@stylistic/dot-location": ["warn", "property"],
            "@stylistic/key-spacing": "warn",
            "@stylistic/no-confusing-arrow": "warn",
            "@stylistic/no-multi-spaces": "warn",
            "@stylistic/no-trailing-spaces": "warn",
            "@stylistic/no-whitespace-before-property": "warn",
            "@stylistic/operator-linebreak": ["warn", "before"],
            "@stylistic/rest-spread-spacing": "warn",
            "@stylistic/space-before-blocks": "warn",
            "@stylistic/space-in-parens": "warn",
            "@stylistic/space-unary-ops": "warn",
            "@stylistic/spaced-comment": "warn"
        }
    }
);
