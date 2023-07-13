import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: `@emotion/react`,
			babel: {
				plugins: [`@emotion/babel-plugin`],
			},
		}),
		tsconfigPaths(),
	],
	esbuild: {
		define: {
			this: `window`,
		},
	},
	test: {
		globals: true,
		environment: `jsdom`,
	},
})
