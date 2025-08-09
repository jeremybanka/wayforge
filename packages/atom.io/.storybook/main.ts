import { dirname, join, resolve } from "node:path"

import type { StorybookConfig } from "@storybook/react-vite"
import { mergeConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

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
			plugins: [tsconfigPaths({ projects: [`./tsconfig.json`] })],
		}),
}
export default config
