import { existsSync, mkdirSync, renameSync } from "node:fs"
import { resolve } from "node:path"

import type { RestartRef, ServiceRef } from "../lib"
import { BACKUPS_DIR, SERVICES_DIR, UPDATES_DIR } from "../lib"
import { startService } from "./start-service"

export function applyUpdate(
	serviceRef: ServiceRef,
	restartRef: RestartRef,
	repo: string,
	app: string,
): void {
	console.log(`Updating service ${repo}/${app}...`)

	const updatesAppDir = resolve(UPDATES_DIR, repo, app)

	if (existsSync(updatesAppDir)) {
		if (serviceRef.process) {
			console.log(
				`Tried to apply update but failed: Service ${repo}/${app} is currently running.`,
			)
			return
		}
		const appDir = resolve(SERVICES_DIR, repo, app)
		const backupDir = resolve(BACKUPS_DIR, repo, app)
		if (!existsSync(backupDir)) {
			mkdirSync(backupDir, { recursive: true })
		}

		renameSync(appDir, backupDir)
		renameSync(updatesAppDir, appDir)
		restartRef.restartTimes = []
	} else {
		console.log(`Service ${repo}/${app} is already up to date.`)
	}
}
