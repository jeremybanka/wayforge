import { minimatch } from "minimatch"
import { exec } from "node:child_process"
import logger from "npmlog"
import simpleGit from "simple-git"

export const PERFORMANCE_MARKERS: PerformanceMark[] = []
function mark(text: string) {
	PERFORMANCE_MARKERS.push(performance.mark(text))
}
export function logMarks(): void {
	for (let i = 0, j = 1; j < PERFORMANCE_MARKERS.length; i++, j++) {
		const start = PERFORMANCE_MARKERS[i]
		const end = PERFORMANCE_MARKERS[j]
		const metric = performance.measure(
			`${start.name} -> ${end.name}`,
			start.name,
			end.name,
		)
		logger.info(end.name, metric.duration)
	}
	const overall = performance.measure(
		`overall`,
		PERFORMANCE_MARKERS[0].name,
		PERFORMANCE_MARKERS[PERFORMANCE_MARKERS.length - 1].name,
	)
	logger.info(`TOTAL TIME`, overall.duration)
}

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
	| {
			gitWasClean: true
			gitFetchedReleaseTags: boolean
			lastReleaseFound: false
	  }
	| {
			gitWasClean: true
			gitFetchedReleaseTags: boolean
			lastReleaseFound: true
			lastReleaseTag: string
			testsWereFound: false
	  }
	| {
			gitWasClean: true
			gitFetchedReleaseTags: boolean
			lastReleaseFound: true
			lastReleaseTag: string
			testsWereFound: true
			testsFound: string[]
			breakingChangesFound: false
	  }
	| {
			gitWasClean: true
			gitFetchedReleaseTags: boolean
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
	mark(`breakCheck`)
	const git = simpleGit(baseDirname)
	mark(`spawn git`)
	const isGitClean = (await git.checkIsRepo()) && (await git.status()).isClean()
	mark(`is git clean`)
	if (!isGitClean) {
		return {
			summary: `The git repository must be clean to run this command.`,
			gitWasClean: false,
		}
	}
	let gitFetchedReleaseTags = false
	const tagsOut = await git.listRemote([`--tags`, `origin`])

	mark(`list remote tags`)
	gitFetchedReleaseTags = true
	const tags = tagsOut.split(`\n`).toReversed()
	const latestReleaseTagRaw = tagPattern
		? tags.find((tag) => tag.match(tagPattern))
		: tags[0]
	const latestReleaseTag = latestReleaseTagRaw?.split(`\t`)[1].split(`^`)[0]
	mark(`found latest release tag`)
	if (!latestReleaseTag) {
		return {
			summary: `No tags found matching the pattern "${tagPattern}".`,
			gitWasClean: true,
			gitFetchedReleaseTags,
			lastReleaseFound: false,
		}
	}
	await git.fetch([`origin`, latestReleaseTag, `--no-tags`])
	mark(`fetched latest release tag`)

	const productionFiles = await new Promise<string[]>((resolve, reject) => {
		const treeResult = exec(
			`git ls-tree -r --name-only ${latestReleaseTag}`,
			{ cwd: baseDirname },
			async (_, stdout, stderr) => {
				await git.stash()
				if (treeResult.exitCode === 0) {
					resolve(stdout.split(`\n`))
				} else {
					reject(stderr)
				}
			},
		)
	})
	mark(`listed all files checked into git`)
	const productionTestFiles = productionFiles.filter((file) =>
		minimatch(file, testPattern),
	)
	mark(`filtered to public test files`)

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
	mark(`checked out public tests from latest release tag`)

	try {
		const noBreakingChangesDetected = await new Promise<
			BreakCheckOutcome & { summary: string }
		>((resolve, reject) => {
			const result = exec(
				testCommand,
				{ cwd: baseDirname },
				async (_, __, stderr) => {
					await git.stash()
					if (result.exitCode === 0) {
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
						reject(stderr)
					}
				},
			)
		})
		return noBreakingChangesDetected
	} catch (thrown) {
		return new Promise<BreakCheckOutcome & { summary: string }>((resolve) => {
			const result = exec(
				certifyCommand,
				{ cwd: baseDirname },
				async (_, stdout, stderr) => {
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
