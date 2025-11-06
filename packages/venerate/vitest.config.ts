import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

export const config: UserConfig = defineConfig({
	test: {
		globals: true,
		coverage: {
			reporter: [`text`, `lcov`, `json`],
			include: [`**/src`],
			exclude: [`__unstable__`],
		},
	},
})

export default config
