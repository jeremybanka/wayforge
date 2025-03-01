import Database from "bun:sqlite"

import { downloadCoverageDatabaseFromS3 } from "./persist-s3"
import { BranchCoverage } from "./recoverage"

const database = await initDatabase()

export async function initDatabase(): Promise<Database> {
	await downloadCoverageDatabaseFromS3()
	const db = new Database(`./coverage.sqlite`)
	db.run(`create table if not exists coverage (git_ref text, coverage text);`)
	return db
}

export const saveCoverage = database.prepare<
	BranchCoverage,
	{
		$git_ref: string
		$coverage: string
	}
>(`insert into coverage (git_ref, coverage) values ($git_ref, $coverage)`)

export const getCoverage = database
	.query<BranchCoverage, [string]>(
		`SELECT * FROM coverage WHERE git_ref = $git_ref`,
	)
	.as(BranchCoverage)
