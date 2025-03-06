import type { BranchCoverage } from "./recoverage"

export async function downloadCoverageReportFromCloud(
	gitRef: string,
	cloudToken: string,
	cloudHost = `https://recoverage.cloud`,
): Promise<Error | string> {
	const url = new URL(`/reporter/${gitRef}`, cloudHost)
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
	branchCoverage: BranchCoverage,
	cloudToken: string,
	cloudHost = `https://recoverage.cloud`,
): Promise<Error | { success: true }> {
	const url = new URL(`/reporter/${branchCoverage.git_ref}`, cloudHost)
	try {
		const response = await fetch(url, {
			method: `PUT`,
			headers: {
				Authorization: `Bearer ${cloudToken}`,
			},
			body: branchCoverage.coverage,
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
