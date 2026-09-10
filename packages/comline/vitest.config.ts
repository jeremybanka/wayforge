import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

import { shellSource } from "./shell-source.config.ts"

const config: UserConfig = defineConfig({
	plugins: [shellSource],
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
