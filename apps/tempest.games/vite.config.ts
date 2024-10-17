import react from "@vitejs/plugin-react-swc"
import { loadEnv } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
	const { dirname } = import.meta
	const env = loadEnv(mode, dirname, mode === `test` ? `` : undefined)
	Object.assign(import.meta, { env })
	await import(`./src/library/env`)
	return {
		plugins: [react(), tsconfigPaths()],
		build: { outDir: `app` },
		css: { preprocessorOptions: { scss: { api: `modern-compiler` } } },
		server: { port: 3333 },
		test: {
			env,
			globals: true,
			globalSetup: `./__scripts__/setup.vitest.ts`,
			include: [`src/**/*.test.ts`],
		},
	}
})
