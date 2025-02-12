#!/usr/bin/env bun

import { $, file, write } from "bun"
import { Database } from "bun:sqlite"
import colors from "colors"
import * as Diff from "diff"
import { createCoverageMap } from "istanbul-lib-coverage"
import simpleGit from "simple-git"
import tmp from "tmp"

const COLUMNS = String(150)

class BranchCoverage {
	public git_ref: string
	public coverage: string
}

const git = simpleGit(import.meta.dir)
const { current: currentGitBranch, branches } = await git.branch()
const currentGitRef =
	currentGitBranch === `main` ? `main` : branches[currentGitBranch].commit

const coverageFile = file(`./coverage/coverage-final.json`)
const coverageJson = await coverageFile.json()
const coverageMap = createCoverageMap(coverageJson)

const db = new Database(`./coverage.sqlite`)
function setupDatabase() {
	return db.run(
		`create table if not exists coverage (git_ref text, coverage text);`,
	)
}
setupDatabase()
const insertCoverage = db.prepare(
	`insert into coverage (git_ref, coverage) values ($git_ref, $coverage)`,
)
const getCoverage = db
	.query(`SELECT * FROM coverage WHERE git_ref = $git_ref`)
	.as(BranchCoverage)

insertCoverage.run({
	$git_ref: currentGitRef,
	$coverage: JSON.stringify(coverageMap),
})
const mainCoverage = getCoverage.all(`main`)
const currentCoverage = getCoverage.all(currentGitRef)
console.log({ mainCoverage, currentCoverage })

const fileList = await $`ls`.text()

console.log({ fileList })

if (currentGitBranch === `main`) {
	console.log(`updated main coverage`)
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

async function getCoverageSummary(branchCoverage: BranchCoverage) {
	const { git_ref, coverage } = branchCoverage
	const tempDir = tmp.dirSync({ unsafeCleanup: true })
	console.log({ coverage })
	await write(`${tempDir.name}/out.json`, coverage)

	const textReport =
		await $`nyc report --reporter=text --color=0 --temp-dir=${tempDir.name}`
			.env({ ...process.env, COLUMNS })
			.text()
	await $`nyc report --reporter=json-summary --temp-dir=${tempDir.name} --report-dir=${tempDir.name}/coverage`.text()
	const jsonReport = (await file(
		`${tempDir.name}/coverage/coverage-summary.json`,
	).json()) as JsonSummaryReport
	console.log(`${git_ref} coverage:`)
	console.log(textReport)
	console.log(jsonReport)
	return { git_ref, textReport, jsonReport }
}

const [mainCoverageSummary, currentCoverageSummary] = await Promise.all([
	getCoverageSummary(mainCoverage[0]),
	getCoverageSummary(currentCoverage[0]),
])

const coverageDifference =
	currentCoverageSummary.jsonReport.total.statements.pct -
	mainCoverageSummary.jsonReport.total.statements.pct

function logDiff() {
	const diff = Diff.diffLines(
		mainCoverageSummary.textReport,
		currentCoverageSummary.textReport,
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

if (coverageDifference < 0) {
	logDiff()
	console.log(`coverage decreased by ${+coverageDifference}`)
	process.exit(1)
}

if (coverageDifference > 0) {
	logDiff()
	console.log(`coverage increased by ${+coverageDifference}`)
	process.exit(0)
}
