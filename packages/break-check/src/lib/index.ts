import { exec } from "child_process"
import glob from "glob"
import git from "simple-git"
import tmp from "tmp"
import { logger } from "~/apps/core.wayfarer.quest/src/logger"
import { getLatestTag } from "./get-latest-tag"

export default async function main(
	testPattern: string,
	testCommand: string,
	tagPattern: string,
): Promise<void> {
	const baseGitInstance = git()
	const remotes = await baseGitInstance.getRemotes(true)
	const repoUrl = remotes[0].refs.fetch
	const productionTagname = await getLatestTag(baseGitInstance, tagPattern)
	const productionRef = `tags/${productionTagname}`
	const candidateRef = await baseGitInstance.revparse([`HEAD`])
	const tmpDir = tmp.dirSync({ unsafeCleanup: true })

	const tmpGitInstance = git(tmpDir.name)
	await tmpGitInstance.clone(repoUrl, tmpDir.name)
	await tmpGitInstance.checkout(productionRef)
	const productionTestFiles = glob.sync(testPattern, { cwd: tmpDir.name })

	await tmpGitInstance.checkout(candidateRef)
	tmpGitInstance.checkout([candidateRef, `--`, ...productionTestFiles])

	const result = exec(
		testCommand,
		{ cwd: tmpDir.name },
		(err, stdout, stderr) => {
			try {
				if (err) {
					throw err
				}
				if (result.exitCode !== 0) {
					throw new Error(stderr)
				}
				logger.info(`passed`, `no	breaking changes detected`, stdout)
			} catch (thrown) {
				logger.error(`failed`, `breaking changes detected`, thrown)
			} finally {
				logger.info(`completed`, `break-check`, `cleaning up`)
				tmpDir.removeCallback()
			}
		},
	)
}
