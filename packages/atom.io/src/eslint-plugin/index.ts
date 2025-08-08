import type { ESLint } from "eslint"

import * as Rules from "./rules"

export { Rules }

const plugin: ESLint.Plugin = {
	rules: {
		"explicit-state-types": Rules.explicitStateTypes as any,
	},
} satisfies ESLint.Plugin

export default plugin
