import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';

export default [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: typescriptEslintParser,
            ecmaVersion: 2021,
        },
        plugins: {
            "@typescript-eslint": typescriptEslintPlugin,
        },
        "rules": {
            "no-unused-vars": "warn",      // Warn about unused variables
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn", // Warn against 'any' usage in TypeScript
            "eqeqeq": "error"             // Enforce strict equality
        },
    },
];
