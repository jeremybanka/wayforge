#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

type GhRun = {
	conclusion: string
	createdAt: string
	databaseId: number
	displayTitle: string
	event: string
	headBranch: string
	headSha: string
	status: string
}

type GhJob = {
	conclusion: string
	databaseId: number
	name: string
	status: string
	url: string
}

type ParsedDiffRow = {
	sign: `-` | `+`
	file: string
	statements: string
	branches: string
	functions: string
	lines: string
	uncovered: string
}

type ParsedDiff = {
	baseRef: string
	currentRef: string
	change: `decreased` | `increased`
	rows: ParsedDiffRow[]
}

type CoverageSample = {
	runId: number
	jobId: number
	createdAt: string
	runConclusion: string
	coverageConclusion: string
	displayTitle: string
	event: string
	headBranch: string
	headSha: string
	logPath: string
	diff: ParsedDiff | null
}

type AggregateEntry = {
	signature: string
	sign: `-` | `+`
	file: string
	uncovered: string
	occurrences: number
	runIds: number[]
	jobIds: number[]
	conclusions: Record<string, number>
}

type AggregateFile = {
	file: string
	occurrences: number
	signatures: number
	plusRows: number
	minusRows: number
	uncovered: string[]
}

const RANGE_START = `2026-04-27T00:00:00Z`
const RANGE_END = `2026-05-12T00:00:00Z`

type ScriptOptions = {
	listLimit: number
	maxRuns: number | null
	outputRoot: string
}

function parseOptions(argv: string[]): ScriptOptions {
	let listLimit = 200
	let maxRuns: number | null = 60
	for (const arg of argv) {
		if (arg.startsWith(`--list-limit=`)) {
			listLimit = Number(arg.slice(`--list-limit=`.length))
			continue
		}
		if (arg.startsWith(`--max-runs=`)) {
			const value = arg.slice(`--max-runs=`.length)
			maxRuns = value === `all` ? null : Number(value)
		}
	}
	const suffix = maxRuns === null ? `all` : `max-${maxRuns}`
	return {
		listLimit,
		maxRuns,
		outputRoot: resolve(
			process.cwd(),
			`packages/atom.io/__reports__/recoverage-diff-sample-2026-04-27_2026-05-11-${suffix}`,
		),
	}
}

function stripAnsi(text: string): string {
	return text.replace(/\x1b\[[0-9;]*m/g, ``)
}

function normalizeLogLine(line: string): string {
	const ansiFree = stripAnsi(line)
	const timestampIndex = ansiFree.indexOf(`Z `)
	if (timestampIndex !== -1) {
		return ansiFree.slice(timestampIndex + 2)
	}
	return ansiFree
}

function parseDiffRow(line: string): ParsedDiffRow | null {
	const normalized = normalizeLogLine(line)
	const trimmed = normalized.trimEnd()
	if (!trimmed.startsWith(`+`) && !trimmed.startsWith(`-`)) {
		return null
	}
	const parts = trimmed.split(`|`).map((part) => part.trim())
	if (parts.length < 6) {
		return null
	}
	const sign = parts[0][0]
	if (sign !== `+` && sign !== `-`) {
		return null
	}
	const file = parts[0].slice(1).trim()
	if (!/\.[A-Za-z0-9]+$/.test(file)) {
		return null
	}
	return {
		sign,
		file,
		statements: parts[1],
		branches: parts[2],
		functions: parts[3],
		lines: parts[4],
		uncovered: parts[5],
	}
}

export function parseRecoverageDiff(logText: string): ParsedDiff | null {
	const lines = logText.split(/\r?\n/)
	let diffHeaderIndex = -1
	for (let i = lines.length - 1; i >= 0; i--) {
		const normalized = normalizeLogLine(lines[i])
		if (normalized.includes(`coverage diff between `)) {
			diffHeaderIndex = i
			break
		}
	}
	if (diffHeaderIndex === -1) {
		return null
	}
	const header = normalizeLogLine(lines[diffHeaderIndex])
	const match = header.match(
		/coverage diff between ([0-9a-f+]+) and ([0-9a-f+]+):/,
	)
	if (!match) {
		return null
	}
	const rows: ParsedDiffRow[] = []
	let change: ParsedDiff[`change`] | null = null
	for (let i = diffHeaderIndex + 1; i < lines.length; i++) {
		const normalized = normalizeLogLine(lines[i])
		const row = parseDiffRow(lines[i])
		if (row) {
			rows.push(row)
			continue
		}
		if (normalized.includes(`coverage decreased by `)) {
			change = `decreased`
			break
		}
		if (normalized.includes(`coverage increased by `)) {
			change = `increased`
			break
		}
	}
	if (rows.length === 0 || change === null) {
		return null
	}
	return {
		baseRef: match[1],
		currentRef: match[2],
		change,
		rows,
	}
}

function runGh(args: string[]): string {
	return execFileSync(`gh`, args, {
		cwd: process.cwd(),
		encoding: `utf8`,
		maxBuffer: 32 * 1024 * 1024,
	})
}

function fetchCoverageJob(runId: number): GhJob | null {
	const payload = JSON.parse(
		runGh([`run`, `view`, String(runId), `--json`, `jobs`]),
	) as {
		jobs: GhJob[]
	}
	return payload.jobs.find((job) => job.name === `Coverage`) ?? null
}

function fetchCoverageLog(jobId: number): string {
	return runGh([`run`, `view`, `--job`, String(jobId), `--log`])
}

function ensureFolder(path: string): void {
	mkdirSync(path, { recursive: true })
}

function writeJson(path: string, data: unknown): void {
	ensureFolder(dirname(path))
	writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
}

function writeText(path: string, text: string): void {
	ensureFolder(dirname(path))
	writeFileSync(path, text)
}

function summarize(samples: CoverageSample[]) {
	const changedSamples = samples.filter((sample) => sample.diff !== null)
	const aggregate = new Map<string, AggregateEntry>()
	for (const sample of changedSamples) {
		for (const row of sample.diff?.rows ?? []) {
			const signature = `${row.sign} ${row.file} | ${row.uncovered}`
			const known = aggregate.get(signature)
			if (known) {
				known.occurrences++
				known.runIds.push(sample.runId)
				known.jobIds.push(sample.jobId)
				known.conclusions[sample.coverageConclusion] =
					(known.conclusions[sample.coverageConclusion] ?? 0) + 1
				continue
			}
			aggregate.set(signature, {
				signature,
				sign: row.sign,
				file: row.file,
				uncovered: row.uncovered,
				occurrences: 1,
				runIds: [sample.runId],
				jobIds: [sample.jobId],
				conclusions: { [sample.coverageConclusion]: 1 },
			})
		}
	}

	const bySignature = [...aggregate.values()].sort((a, b) => {
		if (b.occurrences !== a.occurrences) {
			return b.occurrences - a.occurrences
		}
		return a.signature.localeCompare(b.signature)
	})

	const byFileMap = new Map<string, AggregateFile>()
	for (const entry of bySignature) {
		const known = byFileMap.get(entry.file)
		if (known) {
			known.occurrences += entry.occurrences
			known.signatures++
			if (entry.sign === `+`) known.plusRows += entry.occurrences
			if (entry.sign === `-`) known.minusRows += entry.occurrences
			known.uncovered.push(entry.uncovered)
			continue
		}
		byFileMap.set(entry.file, {
			file: entry.file,
			occurrences: entry.occurrences,
			signatures: 1,
			plusRows: entry.sign === `+` ? entry.occurrences : 0,
			minusRows: entry.sign === `-` ? entry.occurrences : 0,
			uncovered: [entry.uncovered],
		})
	}
	const byFile = [...byFileMap.values()]
		.map((entry) => ({
			...entry,
			uncovered: [...new Set(entry.uncovered)].sort(),
		}))
		.sort((a, b) => {
			if (b.occurrences !== a.occurrences) {
				return b.occurrences - a.occurrences
			}
			return a.file.localeCompare(b.file)
		})

	return {
		totalRuns: samples.length,
		runsWithCoverageDiff: changedSamples.length,
		coverageFailures: samples.filter(
			(sample) => sample.coverageConclusion === `failure`,
		).length,
		coverageSuccesses: samples.filter(
			(sample) => sample.coverageConclusion === `success`,
		).length,
		bySignature,
		byFile,
	}
}

function renderMarkdown(
	samples: CoverageSample[],
	summary: ReturnType<typeof summarize>,
): string {
	const lines: string[] = []
	lines.push(`# Recoverage Diff Sample`)
	lines.push(``)
	lines.push(`Range: ${RANGE_START} to ${RANGE_END}`)
	lines.push(``)
	lines.push(`- Coverage jobs sampled: ${summary.totalRuns}`)
	lines.push(
		`- Jobs with a recoverage diff table: ${summary.runsWithCoverageDiff}`,
	)
	lines.push(`- Coverage failures: ${summary.coverageFailures}`)
	lines.push(`- Coverage successes: ${summary.coverageSuccesses}`)
	lines.push(``)
	lines.push(`## Most Frequent Files`)
	lines.push(``)
	for (const entry of summary.byFile.slice(0, 25)) {
		lines.push(
			`- ${entry.file}: ${entry.occurrences} changed rows across ${entry.signatures} signatures; - rows ${entry.minusRows}, + rows ${entry.plusRows}; uncovered ${entry.uncovered.join(
				`; `,
			)}`,
		)
	}
	lines.push(``)
	lines.push(`## Most Frequent Signatures`)
	lines.push(``)
	for (const entry of summary.bySignature.slice(0, 40)) {
		const conclusions = Object.entries(entry.conclusions)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, count]) => `${key}:${count}`)
			.join(`, `)
		lines.push(
			`- ${entry.signature}: ${entry.occurrences} occurrences (${conclusions}); runs ${[
				...new Set(entry.runIds),
			].join(`, `)}`,
		)
	}
	lines.push(``)
	lines.push(`## Sample Runs`)
	lines.push(``)
	for (const sample of samples) {
		const diffStatus =
			sample.diff === null
				? `no-diff`
				: `${sample.diff.change} ${sample.diff.baseRef}->${sample.diff.currentRef} (${sample.diff.rows.length} rows)`
		lines.push(
			`- run ${sample.runId} / job ${sample.jobId}: ${sample.coverageConclusion} on ${sample.createdAt} [${sample.headBranch}] ${diffStatus}`,
		)
	}
	lines.push(``)
	return `${lines.join(`\n`)}\n`
}

function main(): void {
	const options = parseOptions(process.argv.slice(2))
	const listJson = runGh([
		`run`,
		`list`,
		`--workflow`,
		`Test`,
		`--limit`,
		String(options.listLimit),
		`--json`,
		`databaseId,displayTitle,headBranch,headSha,status,conclusion,createdAt,event`,
	])
	let runs = (JSON.parse(listJson) as GhRun[])
		.filter((run) => run.status === `completed`)
		.filter((run) => run.createdAt >= RANGE_START && run.createdAt < RANGE_END)
		.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
	if (options.maxRuns !== null) {
		runs = runs.slice(-options.maxRuns)
	}

	const logsDir = join(options.outputRoot, `logs`)
	ensureFolder(logsDir)

	const samples: CoverageSample[] = []
	for (const [index, run] of runs.entries()) {
		console.error(
			`[${index + 1}/${runs.length}] run ${run.databaseId} ${run.createdAt} ${run.headBranch}`,
		)
		const coverageJob = fetchCoverageJob(run.databaseId)
		if (coverageJob?.status !== `completed`) {
			continue
		}
		const logText = fetchCoverageLog(coverageJob.databaseId)
		const logPath = join(
			logsDir,
			`${run.databaseId}-${coverageJob.databaseId}.log`,
		)
		writeText(logPath, logText)
		samples.push({
			runId: run.databaseId,
			jobId: coverageJob.databaseId,
			createdAt: run.createdAt,
			runConclusion: run.conclusion,
			coverageConclusion: coverageJob.conclusion,
			displayTitle: run.displayTitle,
			event: run.event,
			headBranch: run.headBranch,
			headSha: run.headSha,
			logPath,
			diff: parseRecoverageDiff(logText),
		})
	}

	const summary = summarize(samples)
	writeJson(join(options.outputRoot, `runs.json`), samples)
	writeJson(join(options.outputRoot, `summary.json`), summary)
	writeText(
		join(options.outputRoot, `README.md`),
		renderMarkdown(samples, summary),
	)
	console.log(
		JSON.stringify(
			{
				output: options.outputRoot,
				listLimit: options.listLimit,
				maxRuns: options.maxRuns,
				totalRuns: summary.totalRuns,
				runsWithCoverageDiff: summary.runsWithCoverageDiff,
				coverageFailures: summary.coverageFailures,
				coverageSuccesses: summary.coverageSuccesses,
			},
			null,
			2,
		),
	)
}

if (process.argv[1]) {
	const invokedPath = resolve(process.argv[1])
	const thisFilePath = resolve(import.meta.filename)
	if (invokedPath === thisFilePath) {
		main()
	}
}

export function parseRecoverageDiffFromFile(path: string): ParsedDiff | null {
	return parseRecoverageDiff(readFileSync(path, `utf8`))
}
