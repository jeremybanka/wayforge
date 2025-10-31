import preact from "@preact/preset-vite"
import { defineConfig, UserConfig } from "vite"

// https://vitejs.dev/config/
const config: UserConfig = defineConfig({
	plugins: [preact()],
})

export default config
