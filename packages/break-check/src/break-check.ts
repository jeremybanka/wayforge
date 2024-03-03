import { exec } from "child_process"
import { glob } from "glob"
import logger from "npmlog"
import simpleGit from "simple-git"

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
	console.log({
		latestReleaseTag,
		baseDirname,
		testPattern,
		productionTestFiles,
	})
	await git.checkout(candidateBranchName)
	if (productionTestFiles.length === 0) {
		logger.warn(
			`no breaking changes can be detected`,
			`because no tests were found matching the pattern "${testPattern}"`,
		)
		process.exit(2)
	}
	await git.checkout([latestReleaseTag, `--`, ...productionTestFiles])

	return new Promise((resolve, reject) => {
		const result = exec(
			testCommand,
			{ cwd: baseDirname },
			async (_, stdout, stderr) => {
				logger.info(`completed`, `test`, stdout)
				await git.stash()
				if (result.exitCode === 0) {
					logger.info(`passed`, `no breaking changes detected`)
					resolve()
				} else {
					logger.error(`failed`, `breaking changes detected`)
					reject(stderr)
				}
			},
		)
	})
}
