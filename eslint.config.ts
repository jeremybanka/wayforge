import * as parser from "@typescript-eslint/parser"
import type { RuleModuleWithMetaDocs } from "@typescript-eslint/utils/ts-eslint"
import type { ESLint, Linter } from "eslint"
import * as DrizzlePlugin from "eslint-plugin-drizzle"
import * as ImportPlugin from "eslint-plugin-import-x"
import { default as SimpleImportSortPlugin } from "eslint-plugin-simple-import-sort"
import StorybookPlugin from "eslint-plugin-storybook"

import AtomIOPlugin from "./packages/atom.io/src/eslint-plugin"

type Rules = Linter.Config[`rules`]
type StorybookRules = typeof StorybookPlugin.rules

const WARN = 1
const ERROR = 2

const PARSER_OPTIONS = {
	projectService: true,
	sourceType: `module`,
} satisfies parser.ParserOptions

const COMMON_RULES: Rules = {
	"atom.io/exact-catch-types": ERROR,
	"atom.io/explicit-state-types": [ERROR, { permitAnnotation: true }],
	"atom.io/naming-convention": ERROR,

	"import/newline-after-import": ERROR,
	"import/no-duplicates": ERROR,

	"simple-import-sort/imports": ERROR,
	"simple-import-sort/exports": ERROR,

	"no-mixed-spaces-and-tabs": 0,
	quotes: [ERROR, `backtick`],
}

const IGNORES: Linter.Config = {
	ignores: [
		`**/.astro/**`,
		`**/.wrangler/**`,
		`**/_shared/**`,
		`**/build/**`,
		`**/coverage/**`,
		`**/create-atom.io/templates/**`,
		`**/dist/**`,
		`**/gen/**`,
		`**/next-env.d.ts`,
		`**/node_modules/**`,
		`**/storybook-static/**`,
	],
}

const COMMON: Linter.Config = {
	languageOptions: { parser, parserOptions: PARSER_OPTIONS },
	files: [`**/*.ts{,x}`, `eslint.config.ts`],
	plugins: {
		"atom.io": AtomIOPlugin as ESLint.Plugin,
		import: ImportPlugin,
		"simple-import-sort": SimpleImportSortPlugin,
	},
	rules: COMMON_RULES,
}

const NO_CONSOLE: Linter.Config = {
	files: [
		`packages/atom.io/**/src/**/*.ts{,x}`,
		`apps/tempest.games/src/**/*.ts{,x}`,
	],
	ignores: [`apps/tempest.games/src/frontend/**/*.ts{,x}`, `**/*.test.ts`],
	rules: {
		"no-console": ERROR,
	},
}

const STORYBOOK: Linter.Config = {
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
}

const DRIZZLE: Linter.Config = {
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
}

export default [
	IGNORES,
	COMMON,
	NO_CONSOLE,
	STORYBOOK,
	DRIZZLE,
] satisfies Linter.Config[]
