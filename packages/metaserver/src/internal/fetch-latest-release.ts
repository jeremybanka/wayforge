import { existsSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

import { $ } from "bun"

export async function fetchLatestRelease(
	updatesDir: string,
	repo: string,
	app: string,
): Promise<string | null> {
	// const command = `gh release view --repo ${repo} --json tagName,assets --jq '.assets[] | select(.name | test("${app}")) | .url'`
	try {
		const assetUrl =
			await $`gh release view --repo ${repo} --json tagName,assets --jq '.assets[] | select(.name | test("${app}")) | .url'`
		if (!assetUrl) {
			console.log(`No matching release found for ${repo}/${app}.`)
			return null
		}

		const appDir = resolve(updatesDir, repo, app)
		if (!existsSync(appDir)) {
			mkdirSync(appDir, { recursive: true })
		}

		console.log(`Downloading release for ${repo}/${app}...`)

		await $`gh release download --repo ${repo} --dir ${appDir} --pattern "*${app}*"`

		return appDir
	} catch (thrown) {
		if (thrown instanceof Error) {
			console.error(`Failed to fetch the latest release: ${thrown.message}`)
		}
		return null
	}
}
