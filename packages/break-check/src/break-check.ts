import { exec } from "node:child_process"

import { minimatch } from "minimatch"
import logger from "npmlog"
import simpleGit from "simple-git"

function useMarks() {
	const markers: PerformanceMark[] = []
	function mark(text: string) {
		const prev = markers.at(-1)
		const next = performance.mark(text)
		if (prev) {
			const metric = performance.measure(
				`${prev.name} -> ${next.name}`,
				prev.name,
				next.name,
			)
			logger.info(next.name, metric.duration)
		}
		markers.push(next)
	}
	function logMarks(): void {
		const overall = performance.measure(
			`overall`,
			markers[0].name,
			markers[markers.length - 1].name,
		)
		logger.info(`TOTAL TIME`, overall.duration)
	}
	return { mark, logMarks }
}

export type BreakCheckOptions = {
	tagPattern?: string | undefined
	testPattern: string
	testCommand: string
	certifyCommand: string
	baseDirname?: string
	verbose?: boolean | undefined
}

export type BreakCheckOutcome =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| { gitWasClean: false }
	| {
			gitWasClean: true
			lastReleaseFound: false
	  }
	| {
			gitWasClean: true
			lastReleaseFound: true
			lastReleaseTag: string
			testsWereFound: false
	  }
	| {
			gitWasClean: true
			lastReleaseFound: true
			lastReleaseTag: string
			testsWereFound: true
			testsFound: string[]
			breakingChangesFound: false
	  }
	| {
			gitWasClean: true
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
	verbose = false,
}: BreakCheckOptions): Promise<BreakCheckOutcome & { summary: string }> {
	let mark: ReturnType<typeof useMarks>[`mark`] | undefined
	let logMarks: ReturnType<typeof useMarks>[`logMarks`] | undefined
	if (verbose) {
		const { mark: mark_, logMarks: logMarks_ } = useMarks()
		mark = mark_
		logMarks = logMarks_
	}
	mark?.(`breakCheck`)
	const git = simpleGit(baseDirname)
	mark?.(`spawn git`)
	const isGitClean = (await git.checkIsRepo()) && (await git.status()).isClean()
	mark?.(`is git clean`)
	if (!isGitClean) {
		return {
			summary: `The git repository must be clean to run this command.`,
			gitWasClean: false,
		}
	}
	const tagsRemote = await git.listRemote([`--tags`, `origin`])

	mark?.(`list remote tags`)
	const allTagsRaw = tagsRemote.split(`\n`)
	const tagsRawFiltered = tagPattern
		? allTagsRaw.filter((tag) => tag.match(tagPattern))
		: allTagsRaw
	const tags = tagsRawFiltered
		.map((tag) => tag.split(`\t`)[1].split(`^`)[0]) //.split(`/`)[2])
		.toSorted((a, b) => {
			const aVersion = a.split(`@`)[1]
			const bVersion = b.split(`@`)[1]
			const [aMajor, aMinor, aPatch] = aVersion.split(`.`).map((n) => Number(n))
			const [bMajor, bMinor, bPatch] = bVersion.split(`.`).map((n) => Number(n))
			return bMajor - aMajor || bMinor - aMinor || bPatch - aPatch
		})
	const latestReleaseTag = tags[0]
	mark?.(`found latest release tag`)
	if (!latestReleaseTag) {
		return {
			summary: `No tags found matching the pattern "${tagPattern}".`,
			gitWasClean: true,
			lastReleaseFound: false,
		}
	}
	await git.fetch([
		`origin`,
		`${latestReleaseTag}:${latestReleaseTag}`,
		`--no-tags`,
	])
	mark?.(`fetched latest release tag`)

	let productionFiles: string[]
	try {
		productionFiles = await new Promise<string[]>((resolve, reject) => {
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
	} catch (thrown) {
		mark?.(`failed to list production files`)
		const message =
			thrown instanceof Error
				? thrown.message
				: typeof thrown === `string`
					? thrown
					: undefined
		const summary = `Failed to list production files${
			message ? `: ${message}` : `.`
		}`
		return {
			summary,
			gitWasClean: true,
			lastReleaseFound: true,
			lastReleaseTag: latestReleaseTag,
			testsWereFound: false,
		}
	}
	mark?.(`listed all files checked into git`)
	const productionTestFiles = productionFiles.filter((file) =>
		minimatch(file, testPattern),
	)
	mark?.(`filtered to public test files`)

	if (productionTestFiles.length === 0) {
		return {
			summary: `No tests were found matching the pattern "${testPattern}".`,
			gitWasClean: true,
			lastReleaseFound: true,
			lastReleaseTag: latestReleaseTag,
			testsWereFound: false,
		}
	}
	await git.checkout([latestReleaseTag, `--`, ...productionTestFiles])
	mark?.(`checked out public tests from latest release tag`)

	try {
		const noBreakingChangesDetected = await new Promise<
			BreakCheckOutcome & { summary: string }
		>((resolve, reject) => {
			const result = exec(testCommand, { cwd: baseDirname }, (_, __, stderr) => {
				if (result.exitCode === 0) {
					resolve({
						summary: `No breaking changes were detected.`,
						gitWasClean: true,
						lastReleaseFound: true,
						lastReleaseTag: latestReleaseTag,
						testsWereFound: true,
						testsFound: productionTestFiles,
						breakingChangesFound: false,
					})
				} else {
					reject(stderr)
				}
			})
		})
		mark?.(`passed tests`)
		return noBreakingChangesDetected
	} catch (thrown) {
		mark?.(`failed tests`)
		const breakingChangesCertified = await new Promise<
			BreakCheckOutcome & { summary: string }
		>((resolve) => {
			const result = exec(
				certifyCommand,
				{ cwd: baseDirname },
				(_, stdout, stderr) => {
					const wereCertified = result.exitCode === 0
					mark?.(`${wereCertified ? `passed` : `failed`} certification`)
					resolve({
						summary: wereCertified
							? `Breaking changes were found and certified.`
							: `Breaking changes were found, but not certified.`,
						gitWasClean: true,
						lastReleaseFound: true,
						lastReleaseTag: latestReleaseTag,
						testsWereFound: true,
						testsFound: productionTestFiles,
						breakingChangesFound: true,
						testResult: thrown as string,
						breakingChangesCertified: wereCertified,
						certificationStdout: stdout,
						certificationStderr: stderr,
					})
				},
			)
		})
		return breakingChangesCertified
	} finally {
		await git.stash([`push`, `-u`, `-m="break-check ${tagPattern}"`, `--`, `./`])
		mark?.(`stashed`)
		logMarks?.()
	}
}
