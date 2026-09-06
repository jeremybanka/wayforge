import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		// Integration fixtures share service ports, so their lifetimes must not overlap.
		fileParallelism: false,
		env: { FLIGHTDECK_SECRET: `secret` },
	},
})
