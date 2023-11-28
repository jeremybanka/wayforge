import { defineConfig } from "tsup"
import { BASE_CONFIG_OPTIONS } from "~/packages/atom.io/tsup.config"

export default defineConfig({
	...BASE_CONFIG_OPTIONS,
	tsconfig: `../../tsconfig.json`,
})
