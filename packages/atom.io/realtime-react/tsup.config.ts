import { defineConfig } from "tsup"

export default defineConfig({
	entry: [`./src/index.ts`],
	outDir: `./dist`,
	dts: true,
	format: [`esm`, `cjs`],
	splitting: true,
	treeshake: true,
	sourcemap: true,
	minify: true,
	clean: true,
	jsxFactory: `React.createElement`,
	tsconfig: `../tsconfig.json`,
	external: [`atom.io`, `fp-ts`, `socket.io-client`, `react`, `@emotion/react`],
})
