import { CoverageMap } from "istanbul-lib-coverage"

import type { BranchCoverage } from "./recoverage"
import { env } from "./recoverage.env"

export async function downloadCoverageReportFromCloud(
	gitRef: string,
): Promise<CoverageMap | Error> {
	const baseUrl = env.RECOVERAGE_CLOUD_URL ?? `https://recoverage.cloud`
	const url = new URL(`/reporter/${gitRef}`, baseUrl)
	try {
		const response = await fetch(url, {
			method: `GET`,
			headers: {
				Authorization: `Bearer ${env.RECOVERAGE_CLOUD_TOKEN}`,
			},
		})
		if (!response.ok) {
			const text = await response.text()
			return new Error(
				`Failed to fetch coverage report: [${response.status}] ${text}`,
			)
		}

		const json = await response.json()

		return new CoverageMap(json)
	} catch (error) {
		if (error instanceof Error) {
			return error
		}
		throw error
	}
}

export async function uploadCoverageReportToCloud(
	branchCoverage: BranchCoverage,
): Promise<Error | void> {
	const baseUrl = env.RECOVERAGE_CLOUD_URL ?? `https://recoverage.cloud`
	const url = new URL(`/reporter/${branchCoverage.git_ref}`, baseUrl)
	try {
		const response = await fetch(url, {
			method: `PUT`,
			headers: {
				Authorization: `Bearer ${env.RECOVERAGE_CLOUD_TOKEN}`,
			},
			body: JSON.stringify(branchCoverage.coverage),
		})
		if (!response.ok) {
			const text = await response.text()
			return new Error(
				`Failed to upload coverage report: [${response.status}] ${text}`,
			)
		}
	} catch (error) {
		if (error instanceof Error) {
			return error
		}
		throw error
	}
}
