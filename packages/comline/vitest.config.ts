import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const config: UserConfig = defineConfig({
	test: {
		globals: true,
		coverage: {
			provider: `v8`,
			reporter: [`text`, `lcov`, `json`],
			include: [`src/**/*.ts`],
		},
	},
})

export default config
