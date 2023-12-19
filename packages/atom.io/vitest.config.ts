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
	esbuild: {
		target: `es2022`,
	},
	test: {
		globals: true,
		environment: `happy-dom`,
		coverage: {
			reporter: [`text`, `lcov`],
			include: [`**/src`],
			exclude: [`__unstable__`],
		},
	},
})
