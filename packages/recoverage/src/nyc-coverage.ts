import type { ShellError } from "bun"
import { $, file, write } from "bun"
import tmp from "tmp"

import type { useMarks } from "./logger"
import type { BranchCoverage, JsonSummaryReport } from "./recoverage"

export async function getCoverageJsonSummary(
	branchCoverage: BranchCoverage,
	mark?: ReturnType<typeof useMarks>[`mark`],
): Promise<JsonSummaryReport> {
	const { coverage } = branchCoverage
	const tempDir = tmp.dirSync({ unsafeCleanup: true })
	await write(`${tempDir.name}/out.json`, coverage)
	try {
		await $`nyc report --reporter=json-summary --temp-dir=${tempDir.name} --report-dir=${tempDir.name}/coverage`.text()
	} catch (thrown) {
		const caught = thrown as ShellError
		console.log(caught.stdout.toString())
		console.error(caught.stderr.toString())
		throw new Error(`failed to generate coverage summary`)
	}
	const jsonReport = (await file(
		`${tempDir.name}/coverage/coverage-summary.json`,
	).json()) as JsonSummaryReport
	tempDir.removeCallback()
	mark?.(`got json coverage for ${branchCoverage.git_ref}`)
	return jsonReport
}

export async function getCoverageTextReport(
	branchCoverage: BranchCoverage,
	mark?: ReturnType<typeof useMarks>[`mark`],
): Promise<string> {
	const { coverage } = branchCoverage
	const tempDir = tmp.dirSync({ unsafeCleanup: true })
	await write(`${tempDir.name}/out.json`, coverage)
	let textReport: string
	try {
		textReport = await $`nyc report --reporter=text --temp-dir=${tempDir.name}`
			.env({ ...process.env, COLUMNS: `120`, FORCE_COLOR: `0` })
			.text()
	} catch (thrown) {
		const caught = thrown as ShellError
		console.log(caught.stdout.toString())
		console.error(caught.stderr.toString())
		throw new Error(`failed to generate coverage text report`)
	}
	tempDir.removeCallback()
	mark?.(`got text coverage for ${branchCoverage.git_ref}`)
	// console.log(textReport)
	return textReport
}
