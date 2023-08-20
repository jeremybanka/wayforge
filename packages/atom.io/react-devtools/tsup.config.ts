import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`./src/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: false,
	sourcemap: true,
	clean: true,
	loader: {
		".scss": `css`,
	},
	tsconfig: `../tsconfig.json`,
	external: [
		`@floating-ui/react`,
		`@emotion/react`,
		`ajv`,
		`atom.io`,
		`fp-ts`,
		`framer-motion`,
		`react`,
		`recoil`,
		`rxjs`,
	],
})
