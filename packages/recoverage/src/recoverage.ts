import { createHash } from "node:crypto"
import path from "node:path"

import type { ShellError } from "bun"
import { $, file, S3Client, write } from "bun"
import { Database } from "bun:sqlite"
import colors from "colors"
import * as Diff from "diff"
import { createCoverageMap } from "istanbul-lib-coverage"
import type { SimpleGit } from "simple-git"
import simpleGit from "simple-git"
import tmp from "tmp"

import { env } from "./recoverage.env"

const COLUMNS = String(120)
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

async function setupDatabase(mark?: (text: string) => void): Promise<Database> {
	let sql: { db: Database } | undefined
	if (env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_URL) {
		Bun.s3 = new S3Client({
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
			region: `auto`,
			endpoint: env.R2_URL,
			bucket: `atomio-coverage`,
		})
		mark?.(`downloading coverage database from R2`)
		const remote = Bun.s3.file(`coverage.sqlite`)
		try {
			await write(`./coverage.sqlite`, remote)
			mark?.(`downloaded coverage database from R2`)
		} catch (error) {
			console.error(error)
			mark?.(`downloading coverage database from R2 failed`)
			sql = { db: new Database(`./coverage.sqlite`) }
			await remote.write(Bun.file(`coverage.sqlite`))
			mark?.(`uploaded coverage database from R2`)
		}
	}

	const db = sql?.db ?? new Database(`./coverage.sqlite`)
	db.run(`create table if not exists coverage (git_ref text, coverage text);`)

	return db
}

async function hashRepoState(
	git: SimpleGit,
	mark?: (text: string) => void,
): Promise<string> {
	const { current, branches } = await git.branch()
	const gitStatus = await git.status()
	const gitIsClean = gitStatus.isClean()
	mark?.(`git status is clean: ${gitIsClean}`)
	let currentGitRef = branches[current].commit.slice(0, 7)
	if (!gitIsClean) {
		const gitDiff = await git.diff()
		const gitRootFolder = await git.revparse(`--show-toplevel`)
		const gitStatusHash = createHash(`sha256`).update(gitDiff)
		const untrackedFileData = await Promise.all(
			gitStatus.files
				.filter((f) => f.index === `?`)
				.map(async (f) => {
					const fullPath = path.resolve(gitRootFolder, f.path)
					const fileText = await file(fullPath).text()
					return `UNTRACKED: ${fileText}`
				}),
		)
		for (const fileData of untrackedFileData) {
			gitStatusHash.update(fileData)
		}
		const diffHash = gitStatusHash.digest(`hex`).slice(0, currentGitRef.length)
		currentGitRef = `${currentGitRef}+${diffHash}`

		mark?.(`git status hash created: ${diffHash}`)
	}
	return currentGitRef
}

export async function capture(): Promise<0 | 1> {
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
	const currentGitRef = await hashRepoState(git, mark)
	mark?.(`git ref retrieved`)
	const db = await setupDatabase(mark)

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
	mark?.(`updated coverage for ${currentGitRef}`)
	if (env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_URL) {
		const sqliteFile = Bun.s3.file(`coverage.sqlite`)
		mark?.(`uploading coverage database to R2`)
		await sqliteFile.write(Bun.file(`coverage.sqlite`))
		mark?.(`uploaded coverage database to R2`)
	}
	logMarks?.()
	return 0
}

export async function diff(defaultBranch: string): Promise<0 | 1> {
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
	const mainGitRef = await getDefaultBranchHashRef(git, defaultBranch, mark)
	mark?.(`main git ref: ${mainGitRef}`)
	const currentGitRef = await hashRepoState(git, mark)
	mark?.(`current git ref: ${currentGitRef}`)
	const db = await setupDatabase()
	mark?.(`setup database`)
	const getCoverage = db
		.query<BranchCoverage, [string]>(
			`SELECT * FROM coverage WHERE git_ref = $git_ref`,
		)
		.as(BranchCoverage)

	const [mainCoverage] = getCoverage.all(mainGitRef)
	const [currentCoverage] = getCoverage.all(currentGitRef)

	if (!mainCoverage) {
		mark?.(`no coverage found for the target branch`)
		logMarks?.()
		return 1
	}
	if (!currentCoverage) {
		mark?.(`no coverage found for the current ref`)
		logMarks?.()
		return 1
	}
	if (mainGitRef === currentGitRef) {
		mark?.(`you're already on the target branch`)
		logMarks?.()
		return 0
	}

	async function getCoverageJsonSummary(branchCoverage: BranchCoverage) {
		const { coverage } = branchCoverage
		const tempDir = tmp.dirSync({ unsafeCleanup: true })
		await write(`${tempDir.name}/out.json`, coverage)
		try {
			await $`nyc report --reporter=json-summary --temp-dir=${tempDir.name} --report-dir=${tempDir.name}/coverage`.text()
		} catch (thrown) {
			const caught = thrown as ShellError
			console.log(caught.stdout.toString())
			console.error(caught.stderr.toString())
			throw new Error(`failed to generate coverage summary`)
		}
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
		let textReport: string
		try {
			textReport =
				await $`nyc report --reporter=text --color=0 --temp-dir=${tempDir.name}`
					.env({ ...process.env, COLUMNS })
					.text()
		} catch (thrown) {
			const caught = thrown as ShellError
			console.log(caught.stdout.toString())
			console.error(caught.stderr.toString())
			throw new Error(`failed to generate coverage text report`)
		}
		tempDir.removeCallback()
		mark?.(`coverage for ${branchCoverage.git_ref}`)
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

	const coverageDifference =
		currentCoverageJsonSummary.total.statements.pct -
		mainCoverageJsonSummary.total.statements.pct

	function logDiff() {
		mark?.(`coverage diff between ${mainGitRef} and ${currentGitRef}:`)
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

	if (coverageDifference < 0) {
		logDiff()
		mark?.(`coverage decreased by ${+coverageDifference}%`)
		logMarks?.()
		return 1
	}

	if (coverageDifference > 0) {
		logDiff()
		mark?.(`coverage increased by ${+coverageDifference}%`)
		logMarks?.()
		return 0
	}
	mark?.(`coverage is the same`)
	logMarks?.()
	return 0
}

export async function getDefaultBranchHashRef(
	git: SimpleGit,
	defaultBranch: string,
	mark?: (text: string) => void,
): Promise<string> {
	if (env.CI) {
		await git.fetch(
			`origin`,
			defaultBranch,
			env.CI ? { "--depth": `1` } : undefined,
		)
		mark?.(`fetched origin/${defaultBranch}`)
		const sha = await git.revparse([`origin/${defaultBranch}`])
		return sha.slice(0, 7)
	}
	const sha = await git.revparse([defaultBranch])
	return sha.slice(0, 7)
}
