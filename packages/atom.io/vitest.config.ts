import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"
import includeOnlyDist from "./__scripts__/include-only-dist.node"

const DEVELOPMENT_TSCONFIG = `./tsconfig.json`
const PRODUCTION_TSCONFIG = `./tsconfig.prod.json`

const shouldTestDistFolder = process.env.IMPORT === `dist`
const project = shouldTestDistFolder ? PRODUCTION_TSCONFIG : DEVELOPMENT_TSCONFIG
if (shouldTestDistFolder) {
	includeOnlyDist()
}

export default defineConfig({
	plugins: [
		tsconfigPaths({
			projects: [project],
		}),
	],
	esbuild: {
		target: `es2019`,
	},
	test: {
		globals: true,
		environment: `happy-dom`,
	},
})
