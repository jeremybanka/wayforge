/// <reference types="vitest" />
import preact from "@preact/preset-vite"
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin"
import { defineConfig } from "vite"
import svgrPlugin from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		tsconfigPaths(),
		svgrPlugin({
			svgrOptions: {
				icon: true,
				// ...svgr options (https://react-svgr.com/docs/options/)
			},
		}),
	],
	server: {
		fs: {
			allow: [`src`],
			strict: true,
		},
	},
	build: {
		sourcemap: true,
	},
	esbuild: {
		exclude: `../sample`,
	},

	test: {
		globals: true,
		environment: `happy-dom`,
		css: false,
	},
})
