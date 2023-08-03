import { resolve } from "path"

import react from "@vitejs/plugin-react"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const entry = Object.fromEntries(
	[
		`react-click-handlers`,
		`react-css-vars`,
		`react-elastic-input`,
		`react-error-boundary`,
		`react-json-editor`,
		`react-radial`,
		`react-rx`,
		`recoil-combo`,
		`recoil-effect-storage`,
		`recoil-tools`,
	].map((path) => [path, resolve(__dirname, `src/${path}/index.ts`)]),
)
console.log(entry)

export default defineConfig({
	plugins: [
		react({
			jsxImportSource: `@emotion/react`,
			babel: {
				plugins: [`@emotion/babel-plugin`],
			},
		}),
		tsconfigPaths(),
		dts({
			outDir: `dist`,
			include: [`src/**/*`],
			insertTypesEntry: true,
		}),
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
	build: {
		lib: {
			// Could also be a dictionary or array of multiple entry points
			entry,
			name: `hamr`,
			formats: [`es`, `cjs`],
			fileName: (format, submoduleName) => {
				return `${submoduleName}.${format === `es` ? `mjs` : `js`}`
			},
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: [`react`, `@emotion/*`],
			treeshake: true,
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					react: `react`,
				},
			},
		},
	},
})
