import preact from "@preact/preset-vite"
import type { UserConfig } from "vite"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
const config: UserConfig = defineConfig({
	plugins: [preact()],
})

export default config
