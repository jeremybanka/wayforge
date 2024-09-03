import { existsSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

import { spawn } from "bun"

import type { RestartRef, ServiceRef } from "../lib"
import { SERVICES_DIR, UPDATES_DIR } from "../lib"
import { applyUpdate } from "./apply-update"

export function startService(
	serviceRef: ServiceRef,
	restartRef: RestartRef,
	repo: string,
	app: string,
	runCmd: string,
): ServiceRef {
	const appDir = resolve(SERVICES_DIR, repo, app)
	const updatesAppDir = resolve(UPDATES_DIR, repo, app)

	if (!existsSync(appDir)) {
		mkdirSync(appDir, { recursive: true })
	}
	if (!existsSync(updatesAppDir)) {
		mkdirSync(updatesAppDir, { recursive: true })
	}

	serviceRef.process = spawn([runCmd], {
		cwd: appDir,
		env: import.meta.env,
		onExit(_, exitCode) {
			console.log(`Service ${repo}/${app} exited with code ${exitCode}`)
			serviceRef.process = null
			if (exitCode !== 0) {
				const now = Date.now()
				const fiveMinutesAgo = now - 5 * 60 * 1000
				restartRef.restartTimes = restartRef.restartTimes.filter(
					(time) => time > fiveMinutesAgo,
				)
				restartRef.restartTimes.push(now)

				if (restartRef.restartTimes.length < 5) {
					console.log(`Service ${repo}/${app} crashed. Restarting...`)
					startService(serviceRef, restartRef, repo, app, runCmd)
				} else {
					console.log(
						`Service ${repo}/${app} crashed too many times. Not restarting.`,
					)
				}
			}
		},
		async ipc(message) {
			if (message === `ready to update!` && serviceRef.process) {
				serviceRef.process.kill()
				await serviceRef.process.exited
				serviceRef.process = null
				applyUpdate(serviceRef, restartRef, repo, app)
				startService(serviceRef, restartRef, repo, app, runCmd)
			}
		},
	})

	return serviceRef
}
