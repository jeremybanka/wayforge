import type { Server } from "bun"
import { serve } from "bun"

import { applyUpdate, fetchLatestRelease, startService } from "./internal"
import type { RestartRef, ServiceRef } from "./lib"
import { UPDATES_DIR } from "./lib"

export async function start(
	repo: string,
	app: string,
	runCmd: string,
): Promise<Server> {
	const serviceRef: ServiceRef = { process: null }
	const restartRef: RestartRef = { restartTimes: [] }

	await fetchLatestRelease(UPDATES_DIR, repo, app)
	startService(serviceRef, restartRef, repo, app, runCmd)

	const server = serve({
		async fetch(request: Request): Promise<Response> {
			try {
				let response: Response
				switch (request.method) {
					case `POST`:
						{
							const webhook = await request.json()
							if (webhook.action === `published`) {
								response = new Response(null, { status: 200 })
								await fetchLatestRelease(UPDATES_DIR, repo, app)
								if (serviceRef.process) {
									serviceRef.process.send(`updates are ready!`)
								} else {
									applyUpdate(serviceRef, restartRef, repo, app)
									startService(serviceRef, restartRef, repo, app, runCmd)
								}
								response = new Response(null, { status: 200 })
							} else {
								throw 404
							}
						}
						break
					default:
						throw 405
				}
				return response
			} catch (thrown) {
				if (typeof thrown === `number`) {
					const status = thrown
					return new Response(null, { status })
				}
				console.error(thrown)
				return new Response(null, { status: 500 })
			}
		},
	})
	return server
}
