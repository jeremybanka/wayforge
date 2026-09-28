import type { UserConfig } from "vite"
import { defineConfig } from "vitest/config"

const config: UserConfig = defineConfig({
	test: { testTimeout: 15_000 },
})

export default config
