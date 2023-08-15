import { defineConfig } from "tsup"

export default defineConfig({
	entry: [
		`src/array/index.ts`,
		`src/function/index.ts`,
		`src/id/index.ts`,
		`src/join/index.ts`,
		`src/json/index.ts`,
		`src/json-api/index.ts`,
		`src/json-schema/index.ts`,
		`src/nullish/index.ts`,
		`src/number/index.ts`,
		`src/object/index.ts`,
		`src/reactivity/index.ts`,
		`src/refinement/index.ts`,
		`src/string/index.ts`,
		`src/tree/index.ts`,
	],
	dts: true,
	format: [`esm`, `cjs`],
	splitting: false,
	sourcemap: true,
	clean: true,
})
