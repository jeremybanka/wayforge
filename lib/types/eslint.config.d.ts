// eslint-disable-next-line quotes
declare module "eslint-plugin-import-x" {
	import type { ESLint } from "eslint"

	const plugin: ESLint.Plugin
	export = plugin
}
// eslint-disable-next-line quotes
declare module "@next/eslint-plugin-next" {
	import type { ESLint, Linter } from "eslint"

	const plugin: Omit<ESLint.Plugin, `configs`> & {
		configs: Record<
			`core-web-vitals` | `recommended`,
			Omit<Linter.Config, `rules`> & {
				rules: Record<string, ESLint.Rule.RuleModule>
			}
		>
	}
	export = plugin
}
// eslint-disable-next-line quotes
declare module "@typescript-eslint/eslint-plugin" {
	import type { ESLint } from "eslint"

	const plugin: ESLint.Plugin
	export = plugin
}
