// import { default as TypeScriptPlugin } from "@typescript-eslint/eslint-plugin"
import * as parser from "@typescript-eslint/parser"
import type { RuleModuleWithMetaDocs } from "@typescript-eslint/utils/ts-eslint"
import type { ESLint, Linter } from "eslint"
import * as DrizzlePlugin from "eslint-plugin-drizzle"
import * as ImportPlugin from "eslint-plugin-import-x"
import { default as SimpleImportSortPlugin } from "eslint-plugin-simple-import-sort"
import StorybookPlugin from "eslint-plugin-storybook"

import AtomIOPlugin from "./packages/atom.io/src/eslint-plugin"

type StorybookRules = typeof StorybookPlugin.rules

const WARN = 1
const ERROR = 2

const parserOptions = {
	projectService: true,
	sourceType: `module`,
} satisfies parser.ParserOptions

const commonRules = {
	"atom.io/exact-catch-types": ERROR,
	"atom.io/explicit-state-types": [ERROR, { permitAnnotation: true }],
	"atom.io/naming-convention": ERROR,

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
			`**/.astro/**`,
			`**/.wrangler/**`,
			`**/_shared/**`,
			`**/build/**`,
			`**/coverage/**`,
			`**/dist/**`,
			`**/gen/**`,
			`**/node_modules/**`,
			`**/.next/**`,
			`**/.open-next/**`,
			`**/next-env.d.ts`,
			`**/create-atom.io/templates/**`,
		],
	},
	{
		languageOptions: { parser, parserOptions },
		ignores: [`apps/edge/viceroy-htmx/**`],
		files: [`**/*.ts{,x}`, `eslint.config.ts`],
		plugins: {
			// "@typescript-eslint": TypeScriptPlugin,
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
			// "@typescript-eslint": TypeScriptPlugin,
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
