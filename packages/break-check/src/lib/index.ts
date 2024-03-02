import { exec } from "child_process"
import { glob } from "glob"
import git from "simple-git"
import tmp from "tmp"
import { logger } from "~/apps/core.wayfarer.quest/src/logger"
import { getLatestTag } from "./get-latest-tag"

export async function breakCheck(
	tagPattern: string,
	testPattern: string,
	testCommand: string,
	baseDirname = process.cwd(),
): Promise<void> {
	const baseGitInstance = git(baseDirname)
	const remotes = await baseGitInstance.getRemotes(true)
	// const repoUrl = remotes[0].refs.fetch
	const productionTagname = await getLatestTag(baseGitInstance, tagPattern)
	const productionRef = `tags/${productionTagname}`
	const candidateRef = await baseGitInstance.revparse([`HEAD`])

	// const tempDir = tmp.dirSync({ unsafeCleanup: true })
	// const tempGitInstance = git(tempDir.name)
	// await tempGitInstance.clone(repoUrl, tempDir.name)

	await baseGitInstance.checkout(productionRef)
	const productionTestFiles = glob.sync(testPattern, { cwd: baseDirname })
	await baseGitInstance.checkout(candidateRef)
	baseGitInstance.checkout([candidateRef, `--`, ...productionTestFiles])

	return new Promise((resolve, reject) => {
		const result = exec(
			testCommand,
			{ cwd: baseDirname },
			(err, stdout, stderr) => {
				try {
					if (err) {
						throw err
					}
					if (result.exitCode !== 0) {
						throw new Error(stderr)
					}
					logger.info(`passed`, `no	breaking changes detected`, stdout)
					resolve()
				} catch (thrown) {
					logger.error(`failed`, `breaking changes detected`, thrown)
					reject(thrown)
				} finally {
					logger.info(`completed`, `break-check`, `cleaning up`)
				}
			},
		)
	})
}
