import { exec } from "child_process"
import { glob } from "glob"
import logger from "npmlog"
import simpleGit from "simple-git"

export type BreakCheckOptions = {
	tagPattern: string | undefined
	testPattern: string
	testCommand: string
	certifyCommand: string
	baseDirname?: string
}

export type BreakCheckOutcome =
	| `breaking-changes-certified`
	| `no-breaking-changes`

export async function breakCheck({
	tagPattern,
	testPattern,
	testCommand,
	certifyCommand,
	baseDirname = process.cwd(),
}: BreakCheckOptions): Promise<BreakCheckOutcome> {
	const git = simpleGit(baseDirname)
	const isGitClean = (await git.checkIsRepo()) && (await git.status()).isClean
	if (!isGitClean) {
		throw new Error(`The git repository must be clean to run this command.`)
	}
	try {
		await git.fetch([`--depth=1`, `origin`, `+refs/tags/*:refs/tags/*`])
	} catch (thrown) {
		logger.warn(`failed`, `fetching tags`, thrown)
	}
	const tags = (await git.tags()).all.toReversed()
	const latestReleaseTag = tagPattern
		? tags.find((tag) => tag.match(tagPattern))
		: tags[0]
	if (!latestReleaseTag) {
		throw new Error(`No tags found matching this pattern: ${tagPattern}`)
	}
	const candidateBranchName = (await git.branch()).current

	await git.checkout(latestReleaseTag)
	const productionTestFiles = glob.sync(testPattern, { cwd: baseDirname })
	await git.checkout(candidateBranchName)
	if (productionTestFiles.length === 0) {
		logger.error(
			`no breaking changes can be detected`,
			`because no tests were found matching the pattern "${testPattern}"`,
		)
		process.exit(2)
	}
	await git.checkout([latestReleaseTag, `--`, ...productionTestFiles])

	try {
		const noBreakingChangesDetected = await new Promise<BreakCheckOutcome>(
			(resolve, reject) => {
				const result = exec(
					testCommand,
					{ cwd: baseDirname },
					async (_, stdout, stderr) => {
						logger.info(`completed`, `test`, stdout)
						await git.stash()
						if (result.exitCode === 0) {
							logger.info(`passed`, `no breaking changes detected`)
							resolve(`no-breaking-changes`)
						} else {
							logger.warn(
								`failed previous test suite`,
								`breaking changes detected`,
							)
							reject(stderr)
						}
					},
				)
			},
		)
		return noBreakingChangesDetected
	} catch (thrown) {
		logger.info(`breaking changes detected`, thrown)
		return new Promise<BreakCheckOutcome>((resolve, reject) => {
			const result = exec(
				certifyCommand,
				{ cwd: baseDirname },
				async (_, stdout, stderr) => {
					logger.info(`completed`, `certify`, result.exitCode, stdout)
					await git.stash()
					if (result.exitCode === 0) {
						logger.info(`passed`, `breaking changes were certified`)
						resolve(`breaking-changes-certified`)
					} else {
						logger.error(`failed`, `breaking changes detected and uncertified`)
						reject(stderr)
					}
				},
			)
		})
	}
}
