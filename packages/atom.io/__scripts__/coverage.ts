#!/usr/bin/env bun

import { file } from "bun"
import { Database } from "bun:sqlite"
import { createCoverageMap } from "istanbul-lib-coverage"
import { report } from "nyc"

const coverageFile = file(`./coverage/coverage-final.json`)
const coverage = await coverageFile.json()
const coverageMap = createCoverageMap(coverage)

const db = new Database(`./coverage.sqlite`)
function setupDatabase() {
	return db.exec(
		`create table if not exists coverage (git_ref text, coverage text)`,
	)
}
const insertCoverage = db.prepare(
	`insert into coverage (git_ref, coverage) values ($git_ref, $coverage)`,
)
const getCoverage = db.prepare(`select coverage from coverage where git_ref = ?`)

setupDatabase()
insertCoverage.run({
	$git_ref: `main`,
	$coverage: JSON.stringify(coverageMap),
})
getCoverage.run(`main`)
