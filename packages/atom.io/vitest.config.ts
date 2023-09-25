import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const shouldTestDistFolder = process.env.LIB === `dist`
const project = shouldTestDistFolder ? `./tsconfig.prod.json` : `./tsconfig.json`

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
