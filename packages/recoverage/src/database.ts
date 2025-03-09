import type { Statement } from "bun:sqlite"
import Database from "bun:sqlite"

import { logger } from "./logger"
import { downloadCoverageDatabaseFromS3 } from "./persist-s3"
import { BranchCoverage } from "./recoverage"
import { S3_CREDENTIALS } from "./recoverage.env"

type Maybe<T> = T | undefined
let database: Maybe<Database>
export async function initDatabase(): Promise<Database> {
	if (database) {
		return database
	}
	if (S3_CREDENTIALS) {
		logger.mark?.(`downloading coverage database from S3`)
		await downloadCoverageDatabaseFromS3(S3_CREDENTIALS)
	}
	database = new Database(`./coverage.sqlite`)
	database.run(
		`create table if not exists coverage (git_ref text, coverage text, last_updated text default current_timestamp);`,
	)
	logger.mark?.(`set up database`)
	return database
}

export const saveCoverage = (
	db: Database,
): Statement<BranchCoverage, [{ $git_ref: string; $coverage: string }]> =>
	db.prepare(
		`insert into coverage (git_ref, coverage) values ($git_ref, $coverage)`,
	)

export const getCoverage = (
	db: Database,
): Statement<BranchCoverage, [git_ref: string]> =>
	db.query(`SELECT * FROM coverage WHERE git_ref = $git_ref`).as(BranchCoverage)

export const deleteAllButLast10Reports = (
	db: Database,
): Statement<BranchCoverage, []> =>
	db.prepare(
		`DELETE FROM coverage WHERE git_ref NOT IN (SELECT git_ref FROM coverage ORDER BY git_ref DESC LIMIT 10)`,
	)
