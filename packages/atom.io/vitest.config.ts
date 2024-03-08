import { resolve } from "node:path"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const DEVELOPMENT_TSCONFIG = `./tsconfig.json`
const PRODUCTION_TSCONFIG = `./tsconfig.prod.json`

const shouldTestDistFolder = process.env.IMPORT === `dist`
const project = shouldTestDistFolder ? PRODUCTION_TSCONFIG : DEVELOPMENT_TSCONFIG

export default defineConfig({
	plugins: [
		tsconfigPaths({
			projects: [project],
		}),
	],
	resolve: {
		alias: [
			{
				find: `~`,
				replacement: resolve(__dirname, `../..`),
			},
			...[
				`hamr/react-json-editor`,
				`hamr/react-id`,
				`hamr/react-elastic-input`,
				`hamr/react-error-boundary`,
			].map((find) => ({
				find,
				replacement: resolve(__dirname, `./src`),
			})),
		],
	},
	esbuild: {
		target: `es2022`,
	},
	test: {
		globals: true,
		environment: `happy-dom`,
		coverage: {
			reporter: [`text`, `lcov`, `html`],
			include: [`**/src`],
			exclude: [`__unstable__`],
		},
	},
})
