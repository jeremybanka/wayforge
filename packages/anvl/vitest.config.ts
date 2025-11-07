import type { UserConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const config: UserConfig = defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		isolate: false,
	},
})

export default config
