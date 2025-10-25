import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import preact from "@astrojs/preact"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
	integrations: [preact({ compat: true }), mdx()],
	adapter: cloudflare(),
	server: {
		port: 4321,
		host: `0.0.0.0`,
		allowedHosts: [`eris.local`],
	},
})
