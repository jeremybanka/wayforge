/// <reference types="vitest" />
import preact from "@preact/preset-vite"
import { defineConfig } from "vite"
import svgrPlugin from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		preact(),
		// @ts-expect-error stuff's a bit broken with ts 5.5
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
		minify: true,
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
