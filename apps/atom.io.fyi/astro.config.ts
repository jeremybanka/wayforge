import cloudflare from "@astrojs/cloudflare"
import mdx from "@astrojs/mdx"
import preact from "@astrojs/preact"
import { defineConfig, sessionDrivers } from "astro/config"

// https://astro.build/config
export default defineConfig({
	integrations: [preact({ compat: true }), mdx()],
	adapter: cloudflare(),
	session: {
		// Keep session storage self-contained so Astro does not auto-provision
		// a Cloudflare KV namespace for preview deployments.
		driver: sessionDrivers.lruCache(),
	},
	server: {
		port: 4321,
		host: `0.0.0.0`,
		allowedHosts: [`eris.local`],
	},
})
