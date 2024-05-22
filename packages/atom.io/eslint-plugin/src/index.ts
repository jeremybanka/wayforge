import type { ESLint } from "eslint"

import * as Rules from "./rules"

export { Rules }

export default {
	rules: {
		"explicit-state-types": Rules.explicitStateTypes as any,
		lifespan: Rules.lifespan as any,
		"synchronous-selector-dependencies": Rules.synchronousSelectorDependencies,
	},
} satisfies ESLint.Plugin
