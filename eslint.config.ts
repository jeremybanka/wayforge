import * as parser from "@typescript-eslint/parser"
import AtomIOPlugin from "atom.io/eslint-plugin"
import type { ESLint, Linter } from "eslint"
import * as DrizzlePlugin from "eslint-plugin-drizzle"
import * as ImportPlugin from "eslint-plugin-import-x"
import { default as SimpleImportSortPlugin } from "eslint-plugin-simple-import-sort"
import LasertagPlugin from "lasertag/eslint-plugin"

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

// Lasertag applies to the browser DOM. SVG assets and Three.js scene JSX
// use their own intrinsic renderers and cannot acquire custom HTML roots.
const LASERTAG: Linter.Config = {
	files: [`apps/tempest.games/src/frontend/**/*.tsx`],
	ignores: [
		`apps/tempest.games/src/frontend/main.tsx`,
		`apps/tempest.games/src/frontend/<svg>.tsx`,
		`apps/tempest.games/src/frontend/views/Games/BugRangers/Icons.tsx`,
		`apps/tempest.games/src/frontend/views/Games/BugRangers/CubeToken.tsx`,
		`apps/tempest.games/src/frontend/views/Games/BugRangers/HexGridHelper.tsx`,
		`apps/tempest.games/src/frontend/views/Games/BugRangers/HexTile.tsx`,
		`apps/tempest.games/src/frontend/views/Games/BugRangers/PlayerTools.tsx`,
		`apps/tempest.games/src/frontend/views/Games/BugRangers/TilesAndZones.tsx`,
	],
	plugins: { lasertag: LasertagPlugin as ESLint.Plugin },
	rules: {
		"lasertag/access-css-module-class-only": ERROR,
		"lasertag/ban-div": ERROR,
		"lasertag/export-own-component-only": ERROR,
		"lasertag/header-main-footer-as-group": ERROR,
		"lasertag/import-own-css-module-only": ERROR,
		"lasertag/name-imported-css-module-as-css": ERROR,
		"lasertag/render-tag-with-own-name": ERROR,
	},
}

export default [
	IGNORES,
	COMMON,
	NO_CONSOLE,
	DRIZZLE,
	LASERTAG,
] satisfies Linter.Config[]
