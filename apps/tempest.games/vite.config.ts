import react from "@vitejs/plugin-react-swc"
import type { UserConfig } from "vite"
import { loadEnv } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import type { UserConfigFn } from "vitest/config"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig((async ({ mode }) => {
	const env = loadEnv(mode, `.`, mode === `test` ? `` : undefined)
	Object.assign(import.meta, { env })
	await import(`./src/library/env`)
	const { httpsDev } = await import(`./dev/https-dev`)
	const config: UserConfig = {
		plugins: [react(), tsconfigPaths()],
		build: { outDir: `app` },
		css: { preprocessorOptions: { scss: { api: `modern-compiler` } } },
		server: {
			port: 3099,
			...(httpsDev ? { https: httpsDev } : undefined),
		},
		test: {
			env,
			globals: true,
			globalSetup: `./__scripts__/setup.vitest.ts`,
			include: [`src/**/*.test.ts`],
		},
	}

	const hostOverride = env[`VITE_DEV_FRONTEND_HOST`]
	if (hostOverride && config.server) {
		config.server.host = hostOverride
		config.server.hmr = { host: hostOverride }
	}

	return config
}) satisfies UserConfigFn)
