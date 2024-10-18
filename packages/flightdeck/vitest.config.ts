import { defineConfig } from "vitest/config"

export default defineConfig({
	test: { globals: true, env: { FLIGHTDECK_SECRET: `secret` } },
})
