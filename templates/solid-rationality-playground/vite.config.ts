import solid from "vite-plugin-solid"
import type { UserConfig } from "vite"
import { defineConfig } from "vite"

const config: UserConfig = defineConfig({
	plugins: [solid()],
})

export default config
