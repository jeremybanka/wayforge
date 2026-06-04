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
declare module "@typescript-eslint/eslint-plugin" {
	import type { ESLint } from "eslint"

	const plugin: ESLint.Plugin
	export = plugin
}

// eslint-disable-next-line quotes
declare module "@eslint-react/eslint-plugin" {
	import type { ESLint, Linter } from "eslint"

	type Config = Linter.Config & {
		settings?: Record<string, Record<string, unknown>>
	}

	const plugin: ESLint.Plugin & {
		configs: Record<string, Config> & {
			[`recommended-typescript`]: Config
		}
	}
	export default plugin
}
