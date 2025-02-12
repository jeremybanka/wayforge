import { createHash } from "node:crypto"

import { $, file, write } from "bun"
import { Database } from "bun:sqlite"
import colors from "colors"
import * as Diff from "diff"
import { createCoverageMap } from "istanbul-lib-coverage"
import simpleGit from "simple-git"
import tmp from "tmp"

const COLUMNS = String(120)
const DEFAULT_BRANCH = `main`
const VERBOSE = true

class BranchCoverage {
	public git_ref: string
	public coverage: string
}

const logger = {
	info(message: string, ...args: (number | string)[]): void {
		console.log(message, ...args)
	},
}

function useMarks({ inline = false }: { inline?: boolean } = {}) {
	const markers: PerformanceMark[] = []
	const logs: [event: string, duration: number][] = []
	function logMark(event: string, duration: number): void {
		const dur = duration.toFixed(2)
		const space = 80 - 2 - event.length - dur.length
		logger.info(event, `.`.repeat(space), dur)
	}
	function mark(text: string) {
		const prev = markers.at(-1)
		const next = performance.mark(text)
		if (prev) {
			const metric = performance.measure(
				`${prev.name} -> ${next.name}`,
				prev.name,
				next.name,
			)
			if (inline) {
				logMark(next.name, metric.duration)
			} else {
				logs.push([next.name, metric.duration])
			}
		}
		markers.push(next)
	}
	function logMarks(): void {
		const overall = performance.measure(
			`overall`,
			markers[0].name,
			markers[markers.length - 1].name,
		)
		if (!inline) {
			for (const [event, duration] of logs) {
				logMark(event, duration)
			}
		}
		logMark(`TOTAL TIME`, overall.duration)
	}
	return { mark, logMarks }
}

export async function recoverage(): Promise<void> {
	let mark: ReturnType<typeof useMarks>[`mark`] | undefined
	let logMarks: ReturnType<typeof useMarks>[`logMarks`] | undefined
	if (VERBOSE) {
		const { mark: mark_, logMarks: logMarks_ } = useMarks({ inline: true })
		mark = mark_
		logMarks = logMarks_
	}

	mark?.(`recoverage`)

	const git = simpleGit(import.meta.dir)
	mark?.(`spawn git`)
	const { current: currentGitBranch, branches } = await git.branch()
	mark?.(`git branch`)
	const gitStatus = await git.status()
	mark?.(`git status`)
	const mainGitRef = branches[DEFAULT_BRANCH].commit
	const gitIsClean = gitStatus.isClean()
	mark?.(`git status is clean`)
	let currentGitRef = branches[currentGitBranch].commit
	if (!gitIsClean) {
		const gitDiff = await git.diff()
		mark?.(`git diff`)
		const gitStatusHash = createHash(`sha256`).update(gitDiff)
		const untrackedFileData = await Promise.all(
			gitStatus.files
				.filter((f) => f.index === `?`)
				.map(async (f) => `UNTRACKED: ${await file(f.path).text()}`),
		)
		for (const fileData of untrackedFileData) {
			gitStatusHash.update(fileData)
		}
		currentGitRef = `${currentGitRef}-${gitStatusHash.digest(`hex`)}`
		mark?.(`git status hash created`)
	}

	const coverageFile = file(`./coverage/coverage-final.json`)
	const coverageJson = await coverageFile.json()
	const coverageMap = createCoverageMap(coverageJson)

	mark?.(`coverage map created`)

	const db = new Database(`./coverage.sqlite`)
	function setupDatabase() {
		return db.run(
			`create table if not exists coverage (git_ref text, coverage text);`,
		)
	}
	mark?.(`setup database`)
	setupDatabase()
	const insertCoverage = db.prepare(
		`insert into coverage (git_ref, coverage) values ($git_ref, $coverage)`,
	)
	const getCoverage = db
		.query(`SELECT * FROM coverage WHERE git_ref = $git_ref`)
		.as(BranchCoverage)
	mark?.(`queries prepared`)

	insertCoverage.run({
		$git_ref: currentGitRef,
		$coverage: JSON.stringify(coverageMap),
	})
	mark?.(`inserted coverage`)

	const [mainCoverage] = getCoverage.all(mainGitRef)
	const [currentCoverage] = getCoverage.all(currentGitRef)

	mark?.(`got coverage`)

	if (mainGitRef === currentGitRef) {
		console.log(`updated main coverage`)
		logMarks?.()
		process.exit(0)
	}

	type CoverageEval = {
		total: number
		covered: number
		skipped: number
		pct: number
	}

	type JsonSummary = {
		branches: CoverageEval
		functions: CoverageEval
		lines: CoverageEval
		statements: CoverageEval
	}
	type JsonSummaryReport = {
		[key: string]: JsonSummary | undefined
	} & {
		total: JsonSummary
	}

	async function getCoverageJsonSummary(branchCoverage: BranchCoverage) {
		const { coverage } = branchCoverage
		const tempDir = tmp.dirSync({ unsafeCleanup: true })
		await write(`${tempDir.name}/out.json`, coverage)
		await $`nyc report --reporter=json-summary --temp-dir=${tempDir.name} --report-dir=${tempDir.name}/coverage`.text()
		const jsonReport = (await file(
			`${tempDir.name}/coverage/coverage-summary.json`,
		).json()) as JsonSummaryReport
		tempDir.removeCallback()
		return jsonReport
	}
	async function getCoverageTextReport(branchCoverage: BranchCoverage) {
		const { coverage } = branchCoverage
		const tempDir = tmp.dirSync({ unsafeCleanup: true })
		await write(`${tempDir.name}/out.json`, coverage)

		const textReport =
			await $`nyc report --reporter=text --color=0 --temp-dir=${tempDir.name}`
				.env({ ...process.env, COLUMNS })
				.text()
		tempDir.removeCallback()
		console.log(branchCoverage.git_ref)
		console.log(textReport)
		return textReport
	}

	const [
		mainCoverageJsonSummary,
		currentCoverageJsonSummary,
		mainCoverageTextReport,
		currentCoverageTextReport,
	] = await Promise.all([
		getCoverageJsonSummary(mainCoverage),
		getCoverageJsonSummary(currentCoverage),
		getCoverageTextReport(mainCoverage),
		getCoverageTextReport(currentCoverage),
	])

	mark?.(`coverage summaries produced`)

	const coverageDifference =
		currentCoverageJsonSummary.total.statements.pct -
		mainCoverageJsonSummary.total.statements.pct

	function logDiff() {
		console.log(`coverage diff between ${mainGitRef} and ${currentGitRef}:`)
		const diff = Diff.diffLines(
			mainCoverageTextReport,
			currentCoverageTextReport,
		)
		for (const part of diff) {
			const text = part.added
				? colors.bgGreen(part.value)
				: part.removed
					? colors.bgRed(part.value)
					: part.value
			process.stdout.write(text)
		}
	}

	if (coverageDifference === 0) {
		console.log(`coverage is the same`)
		process.exit(0)
	}

	if (coverageDifference < 0) {
		logDiff()
		logMarks?.()
		console.log(`coverage decreased by ${+coverageDifference}%`)
		process.exit(1)
	}

	if (coverageDifference > 0) {
		logDiff()
		logMarks?.()
		console.log(`coverage increased by ${+coverageDifference}%`)
		process.exit(0)
	}
}
