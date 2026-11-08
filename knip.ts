import type { KnipConfig } from "knip"

// Public source entrypoints remain roots, including CLIs, workers, and conditional exports.
// Formatter plugins and JSON schemas are loaded by configuration paths, not imports.
// Fixture source is an executable test input and can keep development dependencies live.
// Generated distributions are checked through their authored source entrypoints.
export default {
	workspaces: {
		".": {
			entry: ["correctly.config.ts", "scripts/*.{ts,tsx}", "eslint.config.ts"],
			project: ["*.{ts,tsx,js,cjs,mjs}", "scripts/**/*.{ts,tsx,js,cjs,mjs}"],
			ignoreDependencies: [
				"@dprint/json",
				"@dprint/markdown",
				"@dprint/oxc",
				"@dprint/toml",
				"dprint-plugin-malva",
				"dprint-plugin-markup",
				"dprint-plugin-yaml",
				// Keep workspace CLIs available for manual contributor use.
				"flightdeck",
				"varmint",
			],
		},
		"apps/tempest.games": {
			ignoreDependencies: [
				// Keep workspace CLIs available for manual contributor use.
				"flightdeck",
			],
			entry: [
				"src/frontend.bun.ts!",
				"src/backend.bun.ts!",
				"src/backend.worker.bug-rangers.bun.ts!",
				"src/frontend/main.tsx!",
				"drizzle.config.ts",
				"vite.config.ts",
				"__scripts__/setup.vitest.ts",
				"__scripts__/spoof-cert.bun.ts",
				"emails/**/*.tsx!",
				"__scripts__/**/*.{ts,tsx,js,mjs,cjs}",
			],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
				"emails/**/*.tsx!",
				"__scripts__/**/*.{ts,tsx,js,mjs,cjs}",
			],
		},
		"packages/comline": {
			entry: [
				"src/cli.ts!",
				"tsdown.config.ts",
				"breakage.config.ts",
				"shell-source.config.ts",
				"vitest.config.ts",
				"__tests__/fixtures/**/*.{ts,tsx,js,mjs,cjs}",
			],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/flightdeck": {
			entry: [
				"src/lib.ts!",
				"bin/flightdeck.bin.js!",
				"bin/klaxon.bin.js!",
				"src/flightdeck.x.ts!",
				"src/klaxon.x.ts!",
				"tsdown.config.ts",
				"vitest.config.ts",
				"__scripts__/**/*.{ts,tsx,js,mjs,cjs}",
				"__tests__/fixtures/**/*.{ts,tsx,js,mjs,cjs}",
			],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
				"__scripts__/**/*.{ts,tsx,js,mjs,cjs}",
			],
		},
		"packages/jurist": {
			entry: ["src/jurist.ts!", "tsdown.config.ts", "vitest.config.ts"],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/luum": {
			entry: ["src/index.ts!", "vitest.config.ts"],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/rationality": {
			entry: ["src/index.ts!", "tsdown.config.ts", "vitest.config.ts"],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/rel8": {
			entry: [
				"src/types/index.ts!",
				"src/junction/index.ts!",
				"tsdown.config.ts",
				"vitest.config.ts",
			],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/safedeposit": {
			entry: ["src/safedeposit.ts!", "tsdown.config.ts", "vitest.config.ts"],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/takua": {
			entry: ["src/takua.ts!", "tsdown.config.ts", "vitest.config.ts"],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/treetrunks": {
			entry: [
				"src/treetrunks.ts!",
				"tsdown.config.ts",
				"tonnage.config.ts",
				"vitest.config.ts",
			],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/tsdoc.json": {
			entry: [
				"src/main/index.ts!",
				"src/react/index.ts!",
				"tsdown.config.ts",
				"tonnage.config.ts",
				"__tests__/fixtures/**/*.{ts,tsx,js,mjs,cjs}",
			],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
		},
		"packages/varmint": {
			entry: [
				"src/index.ts!",
				"bin/varmint.bin.js!",
				"src/varmint.x.ts!",
				"tsdown.config.ts",
				"tonnage.config.ts",
				"vitest.config.ts",
				"__tests__/isolation-*/global-*.node.ts",
			],
			project: [
				"*.{ts,tsx,js,cjs,mjs}",
				"{src,bin}/**/*.{ts,tsx,js,cjs,mjs}!",
				"{tests,__tests__,__scripts__,examples,docs,__exhibits__}/**/*.{ts,tsx,js,cjs,mjs}",
			],
			ignoreUnresolved: [
				// Created in a disposable install by the isolation tests.
				"./.yalc/varmint/bin/varmint.bin.js",
			],
		},
	},
	// Read environment-dependent config as source entries; do not execute it during analysis.
	drizzle: false,
	vite: {
		config: [],
	},
	vitest: {
		config: [],
	},
	// mise/nr are host tools; scutil/mkcert are used by the local certificate script.
	ignoreBinaries: ["mise", "nr", "scutil", "mkcert", "nu"],
	// Preserve public JSON namespace types, socket/config aliases, and the UUID helper used only in database tests.
	ignoreIssues: {
		"packages/varmint/src/typed-json.ts": ["namespaceMembers"],
		"apps/tempest.games/src/frontend/services/socket-auth-service.ts": [
			"duplicates",
		],
		"packages/treetrunks/{tsdown,vitest}.config.ts": ["duplicates"],
		"apps/tempest.games/src/library/as-uuid-node.ts": ["files"],
	},
	// Email templates are production imports; the default plugin treats their dependencies as development-only.
	"react-email": false,
	ignore: ["**/dist/**"],
} satisfies KnipConfig
