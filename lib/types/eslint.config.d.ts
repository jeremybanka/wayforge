// eslint-disable-next-line quotes
declare module "eslint-plugin-import-x" {
	import type { ESLint } from "eslint"

	const plugin: ESLint.Plugin
	export = plugin
}
// eslint-disable-next-line quotes
declare module "eslint-plugin-simple-import-sort" {
	import type { ESLint } from "eslint"

	const plugin: ESLint.Plugin
	export = plugin
}
// eslint-disable-next-line quotes
declare module "@next/eslint-plugin-next" {
	import type { ESLint, Linter } from "eslint"

	type Patch<T, U> = Omit<T, keyof U> & U

	const plugin: Omit<ESLint.Plugin, `configs`> & {
		configs: {
			[Key in `core-web-vitals` | `recommended`]: Patch<
				Linter.Config,
				{ rules: Record<string, Linter.RuleEntry<any[]>> }
			>
		}
	}
	export = plugin
}
// eslint-disable-next-line quotes
declare module "@typescript-eslint/eslint-plugin" {
	import type { ESLint } from "eslint"

	const plugin: ESLint.Plugin
	export = plugin
}
