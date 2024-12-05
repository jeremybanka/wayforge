import { resolve } from "node:path"

import react from "@vitejs/plugin-react"
import dts from "vite-plugin-dts"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const entry = Object.fromEntries(
	[
		`atom.io-combo`,
		`atom.io-tools`,
		`react-click-handlers`,
		`react-css-vars`,
		`react-elastic-input`,
		`react-error-boundary`,
		`react-json-editor`,
		`react-radial`,
		`react-rx`,
	].map((path) => [path, resolve(__dirname, `src/${path}/index.ts`)]),
)
console.log(entry)

export default defineConfig({
	plugins: [
		react(),
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
})
