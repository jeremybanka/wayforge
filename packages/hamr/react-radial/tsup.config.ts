import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`../src/react-radial/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: false,
	sourcemap: true,
	clean: true,
	loader: {
		".scss": `css`,
	},
	external: [`react`, `@emotion/react`, `fp-ts`, `framer-motion`, `corners`],
})
