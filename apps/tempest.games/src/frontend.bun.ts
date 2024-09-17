import { join, normalize, resolve } from "node:path"

import { file, serve } from "bun"

// Set the directory of your Vite app build
const appDir = resolve(import.meta.dir, `..`, `app`)

// Create the HTTP server using Bun
serve({
	port: process.env.PORT ?? 8080,
	static: {
		"/": new Response(await Bun.file(resolve(appDir, `index.html`)).bytes(), {
			headers: {
				"Content-Type": `text/html`,
			},
		}),
	},
	async fetch(req, server) {
		const url = new URL(req.url)

		const ip = server.requestIP(req)?.address ?? `??`
		console.log(`[${ip}]`, req.method, url.pathname)

		// Normalize the requested path and prevent path traversal
		const filePath = join(appDir, url.pathname)
		const normalizedPath = normalize(filePath)

		// Ensure the requested path is still within distDir
		if (!normalizedPath.startsWith(appDir)) {
			return new Response(`403: Forbidden`, { status: 403 })
		}

		const exists = await file(normalizedPath).exists()
		return exists
			? new Response(file(normalizedPath))
			: new Response(`404: Not Found`, { status: 404 })
	},
})

console.log(`Server running at http://localhost:${process.env.PORT ?? 8080}/`)
