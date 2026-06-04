import { cpus } from "node:os"
import { resolve } from "node:path"

import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const shouldTestDistFolder = process.env[`IMPORT`] === `dist`
const atomIoAliases = shouldTestDistFolder
	? []
	: [
			{
				find: /^atom\.io$/,
				replacement: resolve(__dirname, `./src/main`),
			},
			{
				find: /^atom\.io\/(.*)$/,
				replacement: resolve(__dirname, `./src/$1`),
			},
		]

const vitestConfig: UserConfig = defineConfig({
	resolve: {
		alias: [
			...atomIoAliases,
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
