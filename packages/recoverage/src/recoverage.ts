import { createHash } from "node:crypto"

import type { S3File } from "bun"
import { $, file, S3Client, write } from "bun"
import { Database } from "bun:sqlite"
import colors from "colors"
import * as Diff from "diff"
import { createCoverageMap } from "istanbul-lib-coverage"
import simpleGit from "simple-git"
import tmp from "tmp"

import { env } from "./recoverage.env"

const COLUMNS = String(120)
const DEFAULT_BRANCH = `main`
const VERBOSE = true

class BranchCoverage {
	public git_ref: string
	public coverage: string
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

async function setupDatabase(): Promise<Database> {
	if (env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_URL) {
		console.log(`Downloading coverage database from ${env.R2_URL}`)
		Bun.s3 = new S3Client({
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			region: `auto`,
			endpoint: env.R2_URL,
			bucket: `atomio-coverage`,
		})
		const remote = Bun.s3.file(`coverage.sqlite`)
		await write(`./coverage.sqlite`, remote)
		console.log(`Downloaded coverage database from ${env.R2_URL}`)
	}

	const db = new Database(`./coverage.sqlite`)
	db.run(`create table if not exists coverage (git_ref text, coverage text);`)

	return db
}

export async function capture(): Promise<void> {
	let mark: ReturnType<typeof useMarks>[`mark`] | undefined
	let logMarks: ReturnType<typeof useMarks>[`logMarks`] | undefined
	if (VERBOSE) {
		const { mark: mark_, logMarks: logMarks_ } = useMarks({ inline: true })
		mark = mark_
		logMarks = logMarks_
	}
	console.log(`recoverage capture`)
	mark?.(`recoverage`)

	const git = simpleGit(import.meta.dir)
	mark?.(`spawn git`)
	const { current: currentGitBranch, branches } = await git.branch()
	mark?.(`git branch`)
	const gitStatus = await git.status()
	mark?.(`git status`)
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

	mark?.(`coverage map created`)

	const db = await setupDatabase()

	mark?.(`setup database`)
	const coverageFile = file(`./coverage/coverage-final.json`)
	const coverageJson = await coverageFile.json()
	const coverageMap = createCoverageMap(coverageJson)
	const insertCoverage = db.prepare<
		BranchCoverage,
		{
			$git_ref: string
			$coverage: string
		}
	>(`insert into coverage (git_ref, coverage) values ($git_ref, $coverage)`)
	insertCoverage.run({
		$git_ref: currentGitRef,
		$coverage: JSON.stringify(coverageMap),
	})
	mark?.(`inserted coverage`)
	console.log(`updated coverage for`, currentGitRef)
	if (env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_URL) {
		console.log(`Uploading coverage database to ${env.R2_URL}`)
		const sqliteFile = Bun.s3.file(`coverage.sqlite`)
		await sqliteFile.write(Bun.file(`coverage.sqlite`))
		console.log(`Uploaded coverage database to ${env.R2_URL}`)
	}
	logMarks?.()
	process.exit(0)
}
export async function diff(): Promise<void> {
	let mark: ReturnType<typeof useMarks>[`mark`] | undefined
	let logMarks: ReturnType<typeof useMarks>[`logMarks`] | undefined
	if (VERBOSE) {
		const { mark: mark_, logMarks: logMarks_ } = useMarks({ inline: true })
		mark = mark_
		logMarks = logMarks_
	}

	console.log(`recoverage diff`)
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

	mark?.(`coverage map created`)

	const db = await setupDatabase()
	mark?.(`setup database`)
	const getCoverage = db
		.query<BranchCoverage, [string]>(
			`SELECT * FROM coverage WHERE git_ref = $git_ref`,
		)
		.as(BranchCoverage)

	const [mainCoverage] = getCoverage.all(mainGitRef)
	const [currentCoverage] = getCoverage.all(currentGitRef)

	mark?.(`got coverage`)
	if (!mainCoverage) {
		console.log(`no coverage found for the target branch`)
		logMarks?.()
		process.exit(0)
	}
	if (!currentCoverage) {
		console.log(`no coverage found for the current ref`)
		logMarks?.()
		process.exit(0)
	}
	if (mainGitRef === currentGitRef) {
		console.log(`you're already on the target branch`)
		logMarks?.()
		process.exit(0)
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
		const coverageDiffLines = Diff.diffLines(
			mainCoverageTextReport,
			currentCoverageTextReport,
		)
		for (const line of coverageDiffLines) {
			const text = line.added
				? colors.bgGreen(line.value)
				: line.removed
					? colors.bgRed(line.value)
					: line.value
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
