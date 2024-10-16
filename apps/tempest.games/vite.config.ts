import react from "@vitejs/plugin-react-swc"
import { configDotenv } from "dotenv"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	css: {
		preprocessorOptions: { scss: { api: `modern-compiler` } },
	},
	server: {
		port: 3333,
	},
	test: {
		globals: true,
		globalSetup: `./__scripts__/setup.vitest.ts`,
		env: configDotenv().parsed ?? {},
		include: [`src/**/*.test.ts`],
	},
	build: { outDir: `app` },
})
