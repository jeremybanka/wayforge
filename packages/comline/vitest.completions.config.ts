import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const config: UserConfig = defineConfig({
	test: {
		globals: true,
		include: [`__tests__/*.compat.ts`],
		testTimeout: 30_000,
		hookTimeout: 120_000,
	},
})
export default config
