import type { ESLint } from "eslint"

import * as Rules from "./rules"

export { Rules }

const plugin: ESLint.Plugin = {
	rules: {
		"consistent-keys": Rules.consistentAtomNamesAndKeys as any,
		"exact-catch-types": Rules.exactCatchTypes as any,
		"explicit-state-types": Rules.explicitStateTypes as any,
	},
} satisfies ESLint.Plugin

export default plugin
