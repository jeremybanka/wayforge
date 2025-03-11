import type { CoverageMap } from "istanbul-lib-coverage"
import { createContext } from "istanbul-lib-report"
import reports from "istanbul-reports"

import { VirtualFileWriter } from "./istanbul-writer"
import type { JsonSummary } from "./recoverage"

export function getCoverageJsonSummary(coverageMap: CoverageMap): JsonSummary {
	const context = createContext({ coverageMap })
	const writer = new VirtualFileWriter(`/`)
	context.data.writer = writer
	const report = reports.create(`json-summary`, { file: `coverage.json` })
	report.execute(context)
	const jsonReportString = writer.vfs.get(`coverage.json`) as string
	const jsonReport = JSON.parse(jsonReportString) as JsonSummary
	return jsonReport
}

export function getCoverageTextReport(coverageMap: CoverageMap): string {
	const context = createContext({ coverageMap })
	const writer = new VirtualFileWriter(`/`)
	context.data.writer = writer
	const report = reports.create(`text`, { file: `coverage.txt` })
	report.execute(context)
	const textReport = writer.vfs.get(`coverage.txt`) as string
	return textReport
}
