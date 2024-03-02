import { exec } from "child_process"
import { glob } from "glob"
import logger from "npmlog"
import git from "simple-git"

import { getLatestTag } from "./get-latest-tag"

export type BreakCheckOptions = {
	tagPattern: string | undefined
	testPattern: string
	testCommand: string
	baseDirname?: string
}

export async function breakCheck({
	tagPattern,
	testPattern,
	testCommand,
	baseDirname = process.cwd(),
}: BreakCheckOptions): Promise<void> {
	const baseGitInstance = git(baseDirname)
	const isGitClean =
		(await baseGitInstance.checkIsRepo()) &&
		(await baseGitInstance.status()).isClean
	if (!isGitClean) {
		throw new Error(`The git repository must be clean to run this command.`)
	}
	const productionTagname = await getLatestTag(baseGitInstance, tagPattern)
	const productionRef = `tags/${productionTagname}`
	const candidateRef = await baseGitInstance.revparse([`HEAD`])

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
