import { exec } from "node:child_process"
import { glob } from "glob"
import logger from "npmlog"
import simpleGit from "simple-git"

export type BreakCheckOptions = {
	tagPattern?: string | undefined
	testPattern: string
	testCommand: string
	certifyCommand: string
	baseDirname?: string
}

export type BreakCheckOutcome =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| { gitWasClean: false }
	| { gitWasClean: true; gitFetchedReleaseTags: false }
	| { gitWasClean: true; gitFetchedReleaseTags: true; lastReleaseFound: false }
	| {
			gitWasClean: true
			gitFetchedReleaseTags: true
			lastReleaseFound: true
			lastReleaseTag: string
			testsWereFound: false
	  }
	| {
			gitWasClean: true
			gitFetchedReleaseTags: true
			lastReleaseFound: true
			lastReleaseTag: string
			testsWereFound: true
			testsFound: string[]
			breakingChangesFound: false
	  }
	| {
			gitWasClean: true
			gitFetchedReleaseTags: true
			lastReleaseFound: true
			lastReleaseTag: string
			testsWereFound: true
			testsFound: string[]
			breakingChangesFound: true
			testResult: string
			breakingChangesCertified: boolean
			certificationStdout: string
			certificationStderr: string
	  }

export async function breakCheck({
	tagPattern,
	testPattern,
	testCommand,
	certifyCommand,
	baseDirname = process.cwd(),
}: BreakCheckOptions): Promise<BreakCheckOutcome & { summary: string }> {
	const git = simpleGit(baseDirname)
	const isGitClean = (await git.checkIsRepo()) && (await git.status()).isClean
	if (!isGitClean) {
		return {
			summary: `The git repository must be clean to run this command.`,
			gitWasClean: false,
		}
	}
	try {
		await git.fetch([`--depth=1`, `origin`, `+refs/tags/*:refs/tags/*`])
	} catch (thrown) {
		return {
			summary: `Failed to fetch tags from the remote git repository.`,
			gitWasClean: true,
			gitFetchedReleaseTags: false,
		}
	}
	const tags = (await git.tags()).all.toReversed()
	const latestReleaseTag = tagPattern
		? tags.find((tag) => tag.match(tagPattern))
		: tags[0]
	if (!latestReleaseTag) {
		return {
			summary: `No tags found matching the pattern "${tagPattern}".`,
			gitWasClean: true,
			gitFetchedReleaseTags: true,
			lastReleaseFound: false,
		}
	}
	const candidateBranchName = (await git.branch()).current

	await git.checkout(latestReleaseTag)
	const productionTestFiles = glob.sync(testPattern, { cwd: baseDirname })
	await git.checkout(candidateBranchName)
	if (productionTestFiles.length === 0) {
		return {
			summary: `No tests were found matching the pattern "${testPattern}".`,
			gitWasClean: true,
			gitFetchedReleaseTags: true,
			lastReleaseFound: true,
			lastReleaseTag: latestReleaseTag,
			testsWereFound: false,
		}
	}
	await git.checkout([latestReleaseTag, `--`, ...productionTestFiles])

	try {
		const noBreakingChangesDetected = await new Promise<
			BreakCheckOutcome & { summary: string }
		>((resolve, reject) => {
			const result = exec(
				testCommand,
				{ cwd: baseDirname },
				async (_, stdout, stderr) => {
					logger.info(`completed`, `test`, stdout)
					await git.stash()
					if (result.exitCode === 0) {
						logger.info(`passed`, `no breaking changes detected`)
						resolve({
							summary: `No breaking changes were detected.`,
							gitWasClean: true,
							gitFetchedReleaseTags: true,
							lastReleaseFound: true,
							lastReleaseTag: latestReleaseTag,
							testsWereFound: true,
							testsFound: productionTestFiles,
							breakingChangesFound: false,
						})
					} else {
						logger.warn(
							`failed previous test suite`,
							`breaking changes detected`,
						)
						reject(stderr)
					}
				},
			)
		})
		return noBreakingChangesDetected
	} catch (thrown) {
		logger.info(`breaking changes detected`, thrown)
		return new Promise<BreakCheckOutcome & { summary: string }>((resolve) => {
			const result = exec(
				certifyCommand,
				{ cwd: baseDirname },
				async (_, stdout, stderr) => {
					logger.info(`completed`, `certify`, result.exitCode, stdout)
					await git.stash()
					const breakingChangesCertified = result.exitCode === 0
					if (breakingChangesCertified) {
						resolve({
							summary: breakingChangesCertified
								? `Breaking changes were found and certified.`
								: `Breaking changes were found, but not certified.`,
							gitWasClean: true,
							gitFetchedReleaseTags: true,
							lastReleaseFound: true,
							lastReleaseTag: latestReleaseTag,
							testsWereFound: true,
							testsFound: productionTestFiles,
							breakingChangesFound: true,
							testResult: thrown as string,
							breakingChangesCertified,
							certificationStdout: stdout,
							certificationStderr: stderr,
						})
					}
				},
			)
		})
	}
}
