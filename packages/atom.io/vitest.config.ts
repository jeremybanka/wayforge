import { cpus } from "node:os"
import { resolve } from "node:path"

import type { UserConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const DEVELOPMENT_TSCONFIG = `./tsconfig.json`
const PRODUCTION_TSCONFIG = `./tsconfig.prod.json`

const shouldTestDistFolder = process.env[`IMPORT`] === `dist`
const project = shouldTestDistFolder ? PRODUCTION_TSCONFIG : DEVELOPMENT_TSCONFIG

const vitestConfig: UserConfig = defineConfig({
	plugins: [
		tsconfigPaths({
			projects: [project],
		}),
	],
	resolve: {
		conditions: [`browser`, `development`],
		alias: [
			{
				find: /^solid-js\/web$/,
				replacement: resolve(__dirname, `./node_modules/solid-js/web/dist/web.js`),
			},
			{
				find: /^solid-js\/h$/,
				replacement: resolve(__dirname, `./node_modules/solid-js/h/dist/h.js`),
			},
			{
				find: /^solid-js$/,
				replacement: resolve(__dirname, `./node_modules/solid-js/dist/solid.js`),
			},
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
		pool: `vmThreads`,
		maxWorkers: cpus().length - 1,
		globals: true,
		testTimeout: 10_000,
		environment: `happy-dom`,
		coverage: {
			reporter: [`text`, `lcov`, `html`, `json`],
			include: [`**/src`],
			exclude: [`__unstable__`],
		},
	},
})
export default vitestConfig
