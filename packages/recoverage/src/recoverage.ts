import { file } from "bun"
import { createCoverageMap } from "istanbul-lib-coverage"
import simpleGit from "simple-git"

import {
	deleteAllButLast10Reports,
	getCoverage,
	initDatabase,
	saveCoverage,
} from "./database"
import { getBaseGitRef, getCurrentGitRef } from "./git-status"
import { logDiff, logger, useMarks } from "./logger"
import { getCoverageJsonSummary, getCoverageTextReport } from "./nyc-coverage"
import {
	downloadCoverageReportFromCloud,
	uploadCoverageReportToCloud,
} from "./persist-cloud"
import { uploadCoverageDatabaseToS3 } from "./persist-s3"
import { env, S3_CREDENTIALS } from "./recoverage.env"
import { stringify } from "./stringify"

export class BranchCoverage {
	public git_ref: string
	public coverage: string
}

export type CoverageEval = {
	total: number
	covered: number
	skipped: number
	pct: number
}

export type JsonSummary = {
	branches: CoverageEval
	functions: CoverageEval
	lines: CoverageEval
	statements: CoverageEval
}
export type JsonSummaryReport = {
	[key: string]: JsonSummary | undefined
} & {
	total: JsonSummary
}

export type RecoverageOptions = {
	defaultBranch?: string
	silent?: boolean
}

export async function capture(options: RecoverageOptions = {}): Promise<0 | 1> {
	const { defaultBranch = `main`, silent = false } = options
	if (!silent && !logger.mark) {
		Object.assign(logger, useMarks({ inline: false }))
	}
	logger.mark?.(`start`)
	logger.mark?.(`called recoverage capture`)

	const currentGitRef = await getCurrentGitRef()

	const coverageFile = file(`./coverage/coverage-final.json`)
	const coverageJson = await coverageFile.json()
	const coverageMap = createCoverageMap(coverageJson)
	const coverageMapStringified = stringify(coverageMap)

	const db = await initDatabase()
	saveCoverage(db).run({
		$git_ref: currentGitRef,
		$coverage: coverageMapStringified,
	})

	logger.mark?.(`saved local coverage for ${currentGitRef}`)

	const defaultGitRef = await getBaseGitRef(defaultBranch)

	deleteAllButLast10Reports(db).run(defaultGitRef)

	if (currentGitRef === defaultGitRef) {
		logger.mark?.(`we're on the default branch`)
		if (S3_CREDENTIALS) {
			logger.mark?.(`uploading coverage database to S3`)
			await uploadCoverageDatabaseToS3(S3_CREDENTIALS)
			logger.mark?.(`uploaded coverage database to S3`)
		}
		if (env.RECOVERAGE_CLOUD_TOKEN) {
			logger.mark?.(`uploading coverage report to recoverage.cloud`)
			// biome-ignore lint/style/noNonNullAssertion: there's always an element here
			const packageName = process.cwd().split(`/`).at(-1)!
			const cloudResponse = await uploadCoverageReportToCloud(
				packageName,
				coverageMapStringified,
				env.RECOVERAGE_CLOUD_TOKEN,
				env.RECOVERAGE_CLOUD_URL,
			)
			if (cloudResponse instanceof Error) {
				logger.mark?.(`failed to upload coverage report`)
				console.error(cloudResponse)
				return 1
			}
			logger.mark?.(`uploaded coverage report to recoverage.cloud`)
		} else {
			logger.mark?.(`RECOVERAGE_CLOUD_TOKEN not set; skipping upload`)
		}
	} else {
		logger.mark?.(`we're not on the default branch; no need to persist coverage`)
	}

	return 0
}

export async function diff(
	defaultBranch = `main`,
	silent = false,
): Promise<0 | 1> {
	if (!silent && !logger.mark) {
		Object.assign(logger, useMarks({ inline: false }))
	}

	logger.mark?.(`called recoverage diff`)

	const baseGitRef = await getBaseGitRef(defaultBranch)
	const currentGitRef = await getCurrentGitRef()

	const db = await initDatabase()
	let [baseCoverage] = getCoverage(db).all(baseGitRef)
	const [currentCoverage] = getCoverage(db).all(currentGitRef)

	if (!baseCoverage) {
		logger.mark?.(`no coverage found for the target branch`)
		if (!env.RECOVERAGE_CLOUD_TOKEN) {
			logger.mark?.(
				`RECOVERAGE_CLOUD_TOKEN not set; cannot download coverage report`,
			)
			return 1
		}
		// biome-ignore lint/style/noNonNullAssertion: there's always an element here
		const packageName = process.cwd().split(`/`).at(-1)!
		const cloudCoverage = await downloadCoverageReportFromCloud(
			packageName,
			env.RECOVERAGE_CLOUD_TOKEN,
			env.RECOVERAGE_CLOUD_URL,
		)
		logger.mark?.(
			`looking for coverage report "${packageName}" on recoverage.cloud`,
		)
		if (cloudCoverage instanceof Error) {
			logger.mark?.(`failed to download coverage report`)
			console.error(cloudCoverage)
			return 1
		}
		baseCoverage = {
			git_ref: baseGitRef,
			coverage: cloudCoverage,
		}
		logger.mark?.(`found report "${packageName}" on recoverage.cloud`)
		saveCoverage(db).run({
			$git_ref: baseGitRef,
			$coverage: cloudCoverage,
		})
		logger.mark?.(`downloaded coverage report from recoverage.cloud`)
	}

	if (!currentCoverage) {
		logger.mark?.(`no coverage found for the current ref`)
		return 1
	}
	if (baseGitRef === currentGitRef) {
		logger.mark?.(`you're already on the target branch`)
		return 0
	}

	const [
		baseCoverageJsonSummary,
		currentCoverageJsonSummary,
		baseCoverageTextReport,
		currentCoverageTextReport,
	] = await Promise.all([
		getCoverageJsonSummary(baseCoverage, logger.mark),
		getCoverageJsonSummary(currentCoverage, logger.mark),
		getCoverageTextReport(baseCoverage, logger.mark),
		getCoverageTextReport(currentCoverage, logger.mark),
	])

	const coverageDifference =
		currentCoverageJsonSummary.total.statements.pct -
		baseCoverageJsonSummary.total.statements.pct

	if (coverageDifference < 0) {
		logDiff(
			baseGitRef,
			currentGitRef,
			baseCoverageTextReport,
			currentCoverageTextReport,
		)
		logger.mark?.(`coverage decreased by ${+coverageDifference}%`)
		return 1
	}

	if (coverageDifference > 0) {
		logDiff(
			baseGitRef,
			currentGitRef,
			baseCoverageTextReport,
			currentCoverageTextReport,
		)
		logger.mark?.(`coverage increased by ${+coverageDifference}%`)
		return 0
	}
	logger.mark?.(`coverage is the same`)
	return 0
}
