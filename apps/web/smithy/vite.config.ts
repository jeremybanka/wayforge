/// <reference types="vitest" />
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import svgrPlugin from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({
			jsxImportSource: `@emotion/react`,
			babel: {
				plugins: [`@emotion/babel-plugin`],
			},
		}),
		tsconfigPaths(),
		svgrPlugin({
			svgrOptions: {
				icon: true,
				// ...svgr options (https://react-svgr.com/docs/options/)
			},
		}),
	],

	esbuild: {
		define: {
			this: `window`,
		},
	},

	test: {
		globals: true,
		environment: `happy-dom`,
		css: false,
	},
})
