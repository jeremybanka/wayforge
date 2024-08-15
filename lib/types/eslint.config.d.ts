import type { ESLint } from "eslint"

// eslint-disable-next-line quotes
declare module "atom.io/eslint-plugin" {
	const plugin: ESLint.Plugin
	export default plugin
}
// eslint-disable-next-line quotes
declare module "eslint-plugin-import" {
	const plugin: ESLint.Plugin
	export = plugin
}
// eslint-disable-next-line quotes
declare module "@next/eslint-plugin-next" {
	const plugin: ESLint.Plugin
	export default plugin
}
// eslint-disable-next-line quotes
declare module "@typescript-eslint/eslint-plugin" {
	const plugin: ESLint.Plugin
	export = plugin
}
