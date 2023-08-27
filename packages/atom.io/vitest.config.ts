import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [tsconfigPaths()],
	esbuild: {
		target: `es2019`,
	},
	test: {
		globals: true,
		environment: `happy-dom`,
	},
})
