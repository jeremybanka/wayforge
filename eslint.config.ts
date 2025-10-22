import { default as TypeScriptPlugin } from "@typescript-eslint/eslint-plugin"
import * as parser from "@typescript-eslint/parser"
import type { ESLint, Linter } from "eslint"
import * as DrizzlePlugin from "eslint-plugin-drizzle"
import * as ImportPlugin from "eslint-plugin-import-x"
import { default as SimpleImportSortPlugin } from "eslint-plugin-simple-import-sort"
import StorybookPlugin from "eslint-plugin-storybook"

import AtomIOPlugin from "./packages/atom.io/src/eslint-plugin"
import { RuleModuleWithMetaDocs } from "@typescript-eslint/utils/ts-eslint"

type StorybookRules = typeof StorybookPlugin.rules

const WARN = 1
const ERROR = 2

const parserOptions = {
	project: [`./tsconfig.json`],
	sourceType: `module`,
} satisfies parser.ParserOptions

const commonRules = {
	"@typescript-eslint/adjacent-overload-signatures": ERROR,
	"@typescript-eslint/array-type": 0,
	"@typescript-eslint/await-thenable": 0,
	"@typescript-eslint/ban-ts-comment": ERROR,
	"@typescript-eslint/ban-tslint-comment": 0,
	"@typescript-eslint/class-literal-property-style": ERROR,
	"@typescript-eslint/consistent-generic-constructors": 0,
	"@typescript-eslint/consistent-indexed-object-style": 0,
	"@typescript-eslint/consistent-return": 0,
	"@typescript-eslint/consistent-type-assertions": 0,
	"@typescript-eslint/consistent-type-definitions": 0,
	"@typescript-eslint/consistent-type-exports": ERROR,
	"@typescript-eslint/consistent-type-imports": [
		ERROR,
		{
			fixStyle: `separate-type-imports`,
			prefer: `type-imports`,
		},
	],
	"@typescript-eslint/default-param-last": ERROR,
	"@typescript-eslint/dot-notation": 0,
	"@typescript-eslint/explicit-function-return-type": 0,
	"@typescript-eslint/explicit-member-accessibility": ERROR,
	"@typescript-eslint/explicit-module-boundary-types": ERROR,
	"@typescript-eslint/init-declarations": 0,
	"@typescript-eslint/max-params": 0,
	"@typescript-eslint/member-ordering": 0,
	"@typescript-eslint/method-signature-style": 0,
	"@typescript-eslint/naming-convention": [
		0,
		{
			selector: `variable`,
			format: [`strictCamelCase`, `StrictPascalCase`, `UPPER_CASE`],
			leadingUnderscore: `allow`,
			trailingUnderscore: `allow`,
		},
	],
	"@typescript-eslint/no-array-constructor": ERROR,
	"@typescript-eslint/no-array-delete": ERROR,
	"@typescript-eslint/no-base-to-string": ERROR,
	"@typescript-eslint/no-confusing-non-null-assertion": ERROR,
	"@typescript-eslint/no-confusing-void-expression": ERROR,
	"@typescript-eslint/no-duplicate-enum-values": ERROR,
	"@typescript-eslint/no-duplicate-type-constituents": ERROR,
	"@typescript-eslint/no-dynamic-delete": ERROR,
	"@typescript-eslint/no-empty-function": 0,
	"@typescript-eslint/no-empty-interface": ERROR,
	"@typescript-eslint/no-explicit-any": 0,
	"@typescript-eslint/no-extra-non-null-assertion": ERROR,
	"@typescript-eslint/no-extraneous-class": 0,
	"@typescript-eslint/no-floating-promises": ERROR,
	"@typescript-eslint/no-for-in-array": ERROR,
	"@typescript-eslint/no-implied-eval": ERROR,
	"@typescript-eslint/no-import-type-side-effects": ERROR,
	"@typescript-eslint/no-inferrable-types": 0, // not compatible with isolatedDeclarations
	"@typescript-eslint/no-invalid-void-type": 0, // void is good in unions sometimes?
	"@typescript-eslint/no-loop-func": 0,
	"@typescript-eslint/no-loss-of-precision": ERROR,
	"@typescript-eslint/no-magic-numbers": 0,
	"@typescript-eslint/no-meaningless-void-operator": ERROR,
	"@typescript-eslint/no-misused-new": ERROR,
	"@typescript-eslint/no-misused-promises": 0,
	"@typescript-eslint/no-mixed-enums": ERROR,
	"@typescript-eslint/no-namespace": 0,
	"@typescript-eslint/no-non-null-asserted-nullish-coalescing": ERROR,
	"@typescript-eslint/no-non-null-asserted-optional-chain": ERROR,
	"@typescript-eslint/no-non-null-assertion": 0,
	"@typescript-eslint/no-redundant-type-constituents": ERROR,
	"@typescript-eslint/no-require-imports": ERROR,
	"@typescript-eslint/no-restricted-imports": 0,
	"@typescript-eslint/no-shadow": ERROR,
	"@typescript-eslint/no-this-alias": ERROR,
	"@typescript-eslint/no-throw-literal": 0,
	"@typescript-eslint/no-unnecessary-boolean-literal-compare": 0,
	"@typescript-eslint/no-unnecessary-condition": 0,
	"@typescript-eslint/no-unnecessary-qualifier": 0,
	"@typescript-eslint/no-unnecessary-type-arguments": 0,
	"@typescript-eslint/no-unnecessary-type-assertion": ERROR,
	"@typescript-eslint/no-unnecessary-type-constraint": ERROR,
	"@typescript-eslint/no-unnecessary-type-conversion": ERROR,
	"@typescript-eslint/no-unsafe-argument": 0,
	"@typescript-eslint/no-unsafe-assignment": 0,
	"@typescript-eslint/no-unsafe-call": 0,
	"@typescript-eslint/no-unsafe-member-access": 0,
	"@typescript-eslint/no-unsafe-return": 0,
	"@typescript-eslint/no-unsafe-unary-minus": ERROR,
	"@typescript-eslint/no-unused-expressions": 0,
	"@typescript-eslint/no-unused-vars": 0,
	"@typescript-eslint/no-use-before-define": 0,
	"@typescript-eslint/no-useless-constructor": ERROR,
	"@typescript-eslint/no-useless-empty-export": ERROR,
	"@typescript-eslint/no-var-requires": ERROR,
	"@typescript-eslint/non-nullable-type-assertion-style": 0,
	"@typescript-eslint/only-throw-error": ERROR,
	"@typescript-eslint/parameter-properties": 0,
	"@typescript-eslint/prefer-as-const": ERROR,
	"@typescript-eslint/prefer-destructuring": 0,
	"@typescript-eslint/prefer-enum-initializers": ERROR,
	"@typescript-eslint/prefer-find": ERROR,
	"@typescript-eslint/prefer-for-of": ERROR,
	"@typescript-eslint/prefer-function-type": ERROR,
	"@typescript-eslint/prefer-includes": ERROR,
	"@typescript-eslint/prefer-literal-enum-member": ERROR,
	"@typescript-eslint/prefer-namespace-keyword": ERROR,
	"@typescript-eslint/prefer-nullish-coalescing": ERROR,
	"@typescript-eslint/prefer-optional-chain": ERROR,
	"@typescript-eslint/prefer-promise-reject-errors": 0,
	"@typescript-eslint/prefer-readonly": 0,
	"@typescript-eslint/prefer-readonly-parameter-types": 0,
	"@typescript-eslint/prefer-reduce-type-parameter": 0,
	"@typescript-eslint/prefer-regexp-exec": 0,
	"@typescript-eslint/prefer-return-this-type": ERROR,
	"@typescript-eslint/prefer-string-starts-ends-with": ERROR,
	"@typescript-eslint/prefer-ts-expect-error": ERROR,
	"@typescript-eslint/promise-function-async": 0,
	"@typescript-eslint/require-array-sort-compare": 0,
	"@typescript-eslint/require-await": ERROR,
	"@typescript-eslint/restrict-plus-operands": ERROR,
	"@typescript-eslint/restrict-template-expressions": ERROR,
	"@typescript-eslint/return-await": ERROR,
	"@typescript-eslint/sort-type-constituents": ERROR,
	"@typescript-eslint/strict-boolean-expressions": 0,
	"@typescript-eslint/switch-exhaustiveness-check": [
		ERROR,
		{ requireDefaultForNonUnion: true },
	],
	"@typescript-eslint/triple-slash-reference": ERROR,
	"@typescript-eslint/typedef": 0,
	"@typescript-eslint/unbound-method": 0,
	"@typescript-eslint/unified-signatures": ERROR,

	"atom.io/explicit-state-types": ERROR,

	"import/newline-after-import": ERROR,
	"import/no-duplicates": ERROR,

	"simple-import-sort/imports": ERROR,
	"simple-import-sort/exports": ERROR,

	"no-mixed-spaces-and-tabs": 0,
	quotes: [ERROR, `backtick`],
} satisfies Linter.Config[`rules`]

const configs = [
	{
		ignores: [
			"**/.astro/**",
			`**/.wrangler/**`,
			`**/_shared/**`,
			`**/build/**`,
			`**/coverage/**`,
			`**/dist/**`,
			`**/gen/**`,
			`**/node_modules/**`,
			`**/.next/**`,
			"**/.open-next/**",
			`**/next-env.d.ts`,
		],
	},
	{
		languageOptions: { parser, parserOptions },
		ignores: [`apps/edge/viceroy-htmx/**`],
		files: [`**/*.ts{,x}`, `eslint.config.ts`],
		plugins: {
			"@typescript-eslint": TypeScriptPlugin,
			"atom.io": AtomIOPlugin as ESLint.Plugin,
			import: ImportPlugin,
			"simple-import-sort": SimpleImportSortPlugin,
		},
		rules: commonRules,
	},
	{
		languageOptions: {
			parser,
			parserOptions: {
				project:
					process.cwd().split(`/`)[process.cwd().split(`/`).length - 1] ===
					`viceroy-htmx`
						? `./tsconfig.json`
						: `./apps/edge/viceroy-htmx/tsconfig.json`,
			},
		},
		files: [`apps/edge/viceroy-htmx/**/*.ts{,x}`],
		ignores: [`**/bin/**`, `**/dist/**`, `**/*.gen.ts`, `**/node_modules/**`],
		plugins: {
			"@typescript-eslint": TypeScriptPlugin,
			"atom.io": AtomIOPlugin as ESLint.Plugin,
			import: ImportPlugin,
			"simple-import-sort": SimpleImportSortPlugin,
		},
		rules: commonRules,
	},
	{
		files: [
			`packages/atom.io/**/src/**/*.ts{,x}`,
			`apps/tempest.games/src/**/*.ts{,x}`,
		],
		ignores: [`apps/tempest.games/src/frontend/**/*.ts{,x}`, `**/*.test.ts`],
		rules: {
			"no-console": ERROR,
		},
	},
	{
		files: [`packages/atom.io/**/*.stories.ts{,x}`],
		plugins: { storybook: StorybookPlugin as any as ESLint.Plugin },
		rules: {
			quotes: [ERROR, `double`],
			...({
				"storybook/await-interactions": ERROR,
				"storybook/context-in-play-function": ERROR,
				"storybook/csf-component": 0,
				"storybook/default-exports": ERROR,
				"storybook/hierarchy-separator": WARN,
				"storybook/meta-inline-properties": 0,
				"storybook/meta-satisfies-type": 0,
				"storybook/no-redundant-story-name": WARN,
				"storybook/no-renderer-packages": ERROR,
				"storybook/no-stories-of": 0,
				"storybook/no-title-property-in-meta": 0,
				"storybook/no-uninstalled-addons": 0,
				"storybook/prefer-pascal-case": WARN,
				"storybook/story-exports": ERROR,
				"storybook/use-storybook-expect": ERROR,
				"storybook/use-storybook-testing-library": ERROR,
			} satisfies {
				// https://storybook.js.org/docs/configure/integration/eslint-plugin
				[K in keyof StorybookRules as `storybook/${K}`]: StorybookRules[K] extends RuleModuleWithMetaDocs<
					any,
					infer Options
				>
					? 0 | 1 | 2 | [0 | 1 | 2, Options]
					: 0 | 1 | 2
			}),
		},
	},
	{
		files: [`apps/tempest.games/src/**/*.ts{,x}`],
		plugins: {
			drizzle: DrizzlePlugin,
		},
		ignores: [`apps/tempest.games/src/frontend/**/*.ts{,x}`, `**/*.test.ts`],
		rules: {
			"drizzle/enforce-update-with-where": ERROR,
			"drizzle/enforce-delete-with-where": [
				ERROR,
				{
					drizzleObjectName: `db.drizzle`,
				},
			],
		},
	},
	// ...storybook.configs["flat/recommended"],
] satisfies Linter.Config[]

export default configs
