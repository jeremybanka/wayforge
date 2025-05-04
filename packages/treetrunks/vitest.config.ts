import type { UserConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export const config: UserConfig = defineConfig({
	plugins: [tsconfigPaths()],
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
