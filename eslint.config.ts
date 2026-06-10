import * as parser from "@typescript-eslint/parser"
import type { ESLint, Linter } from "eslint"
import * as DrizzlePlugin from "eslint-plugin-drizzle"
import * as ImportPlugin from "eslint-plugin-import-x"
import { default as SimpleImportSortPlugin } from "eslint-plugin-simple-import-sort"
import AtomIOPlugin from "atom.io/eslint-plugin"

type Rules = Linter.Config[`rules`]

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
	files: [`apps/tempest.games/src/**/*.ts{,x}`],
	ignores: [`apps/tempest.games/src/frontend/**/*.ts{,x}`, `**/*.test.ts`],
	rules: {
		"no-console": ERROR,
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
	DRIZZLE,
] satisfies Linter.Config[]
