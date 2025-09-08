import { defineConfig } from "tsdown"

export default defineConfig({
	dts: { sourcemap: true },
	format: [`esm`],
	sourcemap: true,
	treeshake: true,
	tsconfig: `tsconfig.json`,
	clean: true,
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
		`src/primitive/index.ts`,
		`src/reactivity/index.ts`,
		`src/refinement/index.ts`,
		`src/string/index.ts`,
		`src/tree/index.ts`,
	],
})
