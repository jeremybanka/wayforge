import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import type { StorybookConfig } from "@storybook/react-vite"
import { mergeConfig } from "vite"

const STORYBOOK_ROOT = dirname(fileURLToPath(import.meta.url))

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
	return dirname(resolve(join(`node_modules`, value, `package.json`)))
}
const config: StorybookConfig = {
	stories: [`../__stories__/**/*.mdx`, `../__stories__/**/*.stories.ts{,x}`],
	addons: [
		getAbsolutePath(`@storybook/addon-docs`),
		getAbsolutePath(`@storybook/addon-onboarding`),
	],
	framework: {
		name: getAbsolutePath(`@storybook/react-vite`),
		options: {},
	},
	viteFinal: (cfg) =>
		mergeConfig(cfg, {
			resolve: {
				alias: [
					{
						find: /^atom\.io\/react-devtools\/css$/,
						replacement: resolve(
							STORYBOOK_ROOT,
							`../src/react-devtools/devtools.css`,
						),
					},
					{
						find: /^atom\.io$/,
						replacement: resolve(STORYBOOK_ROOT, `../src/main`),
					},
					{
						find: /^atom\.io\/(.*)$/,
						replacement: resolve(STORYBOOK_ROOT, `../src/$1`),
					},
				],
			},
		}),
}
export default config
