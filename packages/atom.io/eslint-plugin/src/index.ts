import type { ESLint } from "eslint"

import * as Rules from "./rules"

export { Rules }

export default {
	rules: {
		"synchronous-selector-dependencies": Rules.synchronousSelectorDependencies,
	},
} satisfies ESLint.Plugin
