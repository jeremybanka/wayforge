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

	const tags = (await git.tags()).all.toReversed()
	const latestReleaseTag = tagPattern
		? tags.find((tag) => tag.match(tagPattern))
		: tags[0]
	if (!latestReleaseTag) {
		throw new Error(`No tags found matching this pattern: ${tagPattern}`)
	}

	const candidateRef = await git.revparse([`HEAD`])

	await git.checkout(latestReleaseTag)
	const productionTestFiles = glob.sync(testPattern, { cwd: baseDirname })
	await git.checkout(candidateRef)
	await git.checkout([latestReleaseTag, `--`, ...productionTestFiles])

	return new Promise((resolve, reject) => {
		const result = exec(
			testCommand,
			{ cwd: baseDirname },
			async (_, stdout, stderr) => {
				await git.stash()
				if (result.exitCode !== 0) {
					logger.error(`failed`, `breaking changes detected`)
					reject(new Error(stderr))
				} else {
					logger.info(`passed`, `no breaking changes detected`, stdout)
					resolve()
				}
			},
		)
	})
}
