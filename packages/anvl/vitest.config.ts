import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const config: UserConfig = defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		globals: true,
		isolate: false,
	},
})

export default config
