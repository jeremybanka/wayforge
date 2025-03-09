import type { CoverageMap } from "istanbul-lib-coverage"

import type { Json } from "./stringify"

export async function downloadCoverageReportFromCloud(
	reportName: string,
	cloudToken: string,
	cloudHost = `https://recoverage.cloud`,
): Promise<Error | string> {
	const url = new URL(`/reporter/${reportName}`, cloudHost)
	try {
		const response = await fetch(url, {
			method: `GET`,
			headers: {
				Authorization: `Bearer ${cloudToken}`,
			},
		})
		if (!response.ok) {
			const text = await response.text()
			return new Error(
				`Failed to fetch coverage report: [${response.status}] ${text}`,
			)
		}

		const text = await response.text()
		return text
	} catch (error) {
		if (error instanceof Error) {
			return error
		}
		throw error
	}
}

export async function uploadCoverageReportToCloud(
	reportName: string,
	coverageMapStringified: Json.stringified<CoverageMap>,
	cloudToken: string,
	cloudHost = `https://recoverage.cloud`,
): Promise<Error | { success: true }> {
	const url = new URL(`/reporter/${reportName}`, cloudHost)
	console.log(`PUT`, url)
	try {
		const response = await fetch(url, {
			method: `PUT`,
			headers: {
				Authorization: `Bearer ${cloudToken}`,
			},
			body: coverageMapStringified,
		})
		if (!response.ok) {
			const text = await response.text()
			return new Error(
				`Failed to upload coverage report: [${response.status}] ${text}`,
			)
		}
		return { success: true }
	} catch (error) {
		if (error instanceof Error) {
			return error
		}
		throw error
	}
}
