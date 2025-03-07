import { file } from "bun"
import { createCoverageMap } from "istanbul-lib-coverage"
import simpleGit from "simple-git"

import { getCoverage, saveCoverage } from "./database"
import { getDefaultBranchHashRef, hashRepoState } from "./git-status"
import { logDiff, logger, useMarks } from "./logger"
import { getCoverageJsonSummary, getCoverageTextReport } from "./nyc-coverage"
import {
	downloadCoverageReportFromCloud,
	uploadCoverageReportToCloud,
} from "./persist-cloud"
import { uploadCoverageDatabaseToS3 } from "./persist-s3"
import { env, S3_CREDENTIALS } from "./recoverage.env"

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

export async function capture(
	defaultBranch = `main`,
	silent = false,
): Promise<0 | 1> {
	if (!silent && !logger.mark) {
		Object.assign(logger, useMarks({ inline: true }))
	}
	logger.mark?.(`called recoverage capture`)

	const git = simpleGit(import.meta.dir)
	logger.mark?.(`spawn git`)
	const currentGitRef = await hashRepoState(git, logger.mark)
	logger.mark?.(`retrieved current git ref: ${currentGitRef}`)

	const coverageFile = file(`./coverage/coverage-final.json`)
	const coverageJson = await coverageFile.json()
	const coverageMap = createCoverageMap(coverageJson)

	saveCoverage.run({
		$git_ref: currentGitRef,
		$coverage: JSON.stringify(coverageMap),
	})

	logger.mark?.(`updated coverage for ${currentGitRef}`)

	if (S3_CREDENTIALS) {
		await uploadCoverageDatabaseToS3(S3_CREDENTIALS)
	}

	if (env.RECOVERAGE_CLOUD_TOKEN) {
		const mainGitRef = await getDefaultBranchHashRef(
			git,
			defaultBranch,
			logger.mark,
		)
		logger.mark?.(`retrieved default branch git ref: ${mainGitRef}`)
		if (currentGitRef === mainGitRef) {
			logger.mark?.(`uploading coverage report to recoverage.cloud`)
			await uploadCoverageReportToCloud(
				{
					git_ref: import.meta.dir,
					coverage: JSON.stringify(coverageMap),
				},
				env.RECOVERAGE_CLOUD_TOKEN,
				env.RECOVERAGE_CLOUD_URL,
			)
		}
		logger.mark?.(`uploaded coverage report to recoverage.cloud`)
	} else {
		logger.mark?.(`RECOVERAGE_CLOUD_TOKEN not set; skipping upload`)
	}

	logger.logMarks?.()
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

	const git = simpleGit(import.meta.dir)
	logger.mark?.(`spawn git`)
	const mainGitRef = await getDefaultBranchHashRef(
		git,
		defaultBranch,
		logger.mark,
	)
	logger.mark?.(`main git ref: ${mainGitRef}`)
	const currentGitRef = await hashRepoState(git, logger.mark)
	logger.mark?.(`current git ref: ${currentGitRef}`)
	logger.mark?.(`setup database`)

	let [mainCoverage] = getCoverage.all(mainGitRef)
	const [currentCoverage] = getCoverage.all(currentGitRef)

	if (!mainCoverage) {
		logger.mark?.(`no coverage found for the target branch`)
		if (!env.RECOVERAGE_CLOUD_TOKEN) {
			logger.mark?.(
				`RECOVERAGE_CLOUD_TOKEN not set; cannot download coverage report`,
			)
			logger.logMarks?.()
			return 1
		}
		logger.mark?.(`looking for coverage report on recoverage.cloud`)
		const cloudCoverage = await downloadCoverageReportFromCloud(
			mainGitRef,
			env.RECOVERAGE_CLOUD_TOKEN,
			env.RECOVERAGE_CLOUD_URL,
		)
		if (cloudCoverage instanceof Error) {
			logger.mark?.(`failed to download coverage report`)
			console.error(cloudCoverage)
			logger.logMarks?.()
			return 1
		}
		mainCoverage = {
			git_ref: mainGitRef,
			coverage: cloudCoverage,
		}
		logger.mark?.(`coverage report found on recoverage.cloud`)
		saveCoverage.run({
			$git_ref: mainGitRef,
			$coverage: cloudCoverage,
		})
		logger.mark?.(`saved coverage for ${mainGitRef}`)
	}
	if (!currentCoverage) {
		logger.mark?.(`no coverage found for the current ref`)
		logger.logMarks?.()
		return 1
	}
	if (mainGitRef === currentGitRef) {
		logger.mark?.(`you're already on the target branch`)
		logger.logMarks?.()
		return 0
	}

	const [
		mainCoverageJsonSummary,
		currentCoverageJsonSummary,
		mainCoverageTextReport,
		currentCoverageTextReport,
	] = await Promise.all([
		getCoverageJsonSummary(mainCoverage, logger.mark),
		getCoverageJsonSummary(currentCoverage, logger.mark),
		getCoverageTextReport(mainCoverage, logger.mark),
		getCoverageTextReport(currentCoverage, logger.mark),
	])

	const coverageDifference =
		currentCoverageJsonSummary.total.statements.pct -
		mainCoverageJsonSummary.total.statements.pct

	if (coverageDifference < 0) {
		logDiff(
			mainGitRef,
			currentGitRef,
			mainCoverageTextReport,
			currentCoverageTextReport,
		)
		logger.mark?.(`coverage decreased by ${+coverageDifference}%`)
		logger.logMarks?.()
		return 1
	}

	if (coverageDifference > 0) {
		logDiff(
			mainGitRef,
			currentGitRef,
			mainCoverageTextReport,
			currentCoverageTextReport,
		)
		logger.mark?.(`coverage increased by ${+coverageDifference}%`)
		logger.logMarks?.()
		return 0
	}
	logger.mark?.(`coverage is the same`)
	logger.logMarks?.()
	return 0
}
