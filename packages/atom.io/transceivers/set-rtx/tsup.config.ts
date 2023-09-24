import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`./src/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: true,
	treeshake: true,
	sourcemap: true,
	clean: true,
	tsconfig: `../../tsconfig.json`,
	external: [
		`atom.io`,
		`atom.io/json`,
		`atom.io/transceivers/set-rtx`,
		`atom.io/internal`,
		`framer-motion`,
		`react`,
		`recoil`,
		`rxjs`,
	],
})
