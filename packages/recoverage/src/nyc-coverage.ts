import type { CoverageMap } from "istanbul-lib-coverage"
import { createCoverageMap } from "istanbul-lib-coverage"
import type { FileWriter } from "istanbul-lib-report"
import { createContext } from "istanbul-lib-report"
import reports from "istanbul-reports"

import type { useMarks } from "./logger"
import type { BranchCoverage, JsonSummaryReport } from "./recoverage"

// A simple in-memory writer to capture report output.
class MemoryWriter implements FileWriter {
	data = ``
	write(chunk: string) {
		this.data += chunk
	}
}

export function getCoverageJsonSummary(
	coverageMap: CoverageMap,
	mark?: ReturnType<typeof useMarks>[`mark`],
): JsonSummaryReport {
	// const { coverage [ ]} = branchCoverage
	// // Create a coverage map from the coverage JSON.
	// const coverageMap = createCoverageMap(coverage)
	// Set up an in-memory writer.
	const writer = new MemoryWriter()
	// Create a reporting context using the coverage map and our custom writer.
	const context = createContext({ coverageMap, writer })
	// Create the JSON summary report.
	const report = reports.create(`json-summary`, {
		file: `coverage-summary.json`,
	})
	report.execute(context)
	// Parse the JSON output captured by the writer.
	const jsonReport = JSON.parse(writer.data) as JsonSummaryReport
	mark?.(`got json coverage for ${branchCoverage.git_ref}`)
	return jsonReport
}

export function getCoverageTextReport(
	coverageMap: CoverageMap,
	// branchCoverage: BranchCoverage,
	mark?: ReturnType<typeof useMarks>[`mark`],
): string {
	// const { coverage } = branchCoverage
	// const coverageMap = createCoverageMap(coverage)
	const writer = new MemoryWriter()
	const context = createContext({ coverageMap })
	context.writer = writer
	// Create the text report.
	const report = reports.create(`text`)
	report.execute(context)
	mark?.(`got text coverage for ${branchCoverage.git_ref}`)
	return writer.data
}
