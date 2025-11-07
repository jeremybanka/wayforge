import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const config: UserConfig = defineConfig({
	test: {
		globals: true,
		isolate: false,
	},
})

export default config
