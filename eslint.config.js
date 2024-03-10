import plugin from "@typescript-eslint/eslint-plugin"
import parser from "@typescript-eslint/parser"
// @ts-check
import eslint from "eslint"

/** @type {import("@typescript-eslint/parser").ParserOptions} */
const parserOptions = {
	project: `./tsconfig.json`,
	sourceType: `module`,
}

/** @type {import("eslint").Linter.FlatConfig} */
const config = {
	languageOptions: {
		parser,
		parserOptions,
	},
	files: [`**/*.ts{,x}`, `eslint.config.js`],
	ignores: [`**/dist/**/*`, `**/gen/**/*`, `apps/node/forge/projects/**/*`],
	plugins: { "@typescript-eslint": plugin },
	rules: {
		"@typescript-eslint/consistent-type-imports": [
			`error`,
			{
				fixStyle: `separate-type-imports`,
				prefer: `type-imports`,
			},
		],
		"@typescript-eslint/explicit-member-accessibility": `error`,
		"@typescript-eslint/explicit-module-boundary-types": `error`,
		"@typescript-eslint/no-explicit-any": `off`,
		"@typescript-eslint/no-unsafe-argument": `off`,
		"@typescript-eslint/no-unsafe-assignment": `off`,
		"@typescript-eslint/no-unsafe-member-access": `off`,
		"@typescript-eslint/no-unsafe-return": `off`,
		"@typescript-eslint/no-unused-vars": `off`,
		"@typescript-eslint/prefer-enum-initializers": `error`,
		"@typescript-eslint/prefer-literal-enum-member": `error`,
		"@typescript-eslint/prefer-optional-chain": `error`,
		"@typescript-eslint/sort-type-constituents": `error`,
		"@typescript-eslint/type-annotation-spacing": `error`,
		"@typescript-eslint/unified-signatures": `error`,

		"no-mixed-spaces-and-tabs": `off`,
		"quotes": [`error`, `backtick`],
		"quote-props": [`error`, `consistent`, { unnecessary: false }],
	},
}
export default [config]
