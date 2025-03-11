import type { Type } from "arktype"
import { type } from "arktype"
import { and, eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import type { MiddlewareHandler } from "hono"
import { Hono } from "hono"
import type {
	CoverageMapData,
	FileCoverageData,
	Location,
	Range,
} from "istanbul-lib-coverage"
import { createCoverageMap } from "istanbul-lib-coverage"
import type { CoverageEval, CoverageSummary, JsonSummary } from "recoverage"

import { createDatabase } from "./db"
import type { Bindings } from "./env"
import { computeHash } from "./hash"
import { stringify } from "./json"
import type { Role } from "./roles-permissions"
import { reportsAllowed } from "./roles-permissions"
import * as schema from "./schema"

type ReporterEnv = {
	Bindings: Bindings
	Variables: {
		drizzle: DrizzleD1Database<typeof schema>
		projectScope: string
		userRole: Role
	}
}
export const reporterRoutes = new Hono<ReporterEnv>()

const reporterAuth: MiddlewareHandler<ReporterEnv> = async (c, next) => {
	const authHeader = c.req.header(`Authorization`)
	if (!authHeader?.startsWith(`Bearer `)) {
		return c.json({ error: `Unauthorized` }, 401)
	}
	const token = authHeader.slice(7) // Remove "Bearer "
	const [id, password] = token.split(`.`)
	if (!id || !password) {
		return c.json({ error: `Invalid token format` }, 401)
	}
	const db = createDatabase(c.env.DB)
	const tokenRecord = await db.query.tokens.findFirst({
		where: eq(schema.tokens.id, id),
		columns: {
			projectId: true,
			salt: true,
			hash: true,
		},
		with: {
			project: {
				with: {
					user: true,
				},
			},
		},
	})

	if (!tokenRecord) {
		return c.json({ error: `Token not found` }, 401)
	}

	const { projectId, salt, hash: realHash } = tokenRecord
	const suppliedHash = await computeHash(password, salt)
	if (suppliedHash !== realHash) {
		return c.json({ error: `Invalid token` }, 401)
	}
	c.set(`drizzle`, db)
	c.set(`projectScope`, projectId)
	c.set(`userRole`, tokenRecord.project.user.role)
	await next()
}

reporterRoutes.get(`/:reportRef`, reporterAuth, async (c) => {
	const reportRef = c.req.param(`reportRef`)
	const projectScope = c.get(`projectScope`)
	const db = c.get(`drizzle`)
	const report = await db.query.reports.findFirst({
		where: and(
			eq(schema.reports.projectId, projectScope),
			eq(schema.reports.ref, reportRef),
		),
	})
	if (!report) {
		return c.json({ error: `No report found` }, 404)
	}
	c.header(`Content-Type`, `application/json`)
	return c.body(report.data)
})

reporterRoutes.put(`/:reportRef`, reporterAuth, async (c) => {
	const projectScope = c.get(`projectScope`)
	const reportRef = c.req.param(`reportRef`)
	const reportRefMaxLength = 64
	const suppliedReportRefLength = reportRef.length
	if (suppliedReportRefLength > reportRefMaxLength) {
		return c.json(
			{
				error: `Report ref is too long, at ${suppliedReportRefLength} characters. Max length is ${reportRefMaxLength}`,
			},
			400,
		)
	}

	const userRole = c.get(`userRole`)
	const numberOfReportsAllowed = reportsAllowed.get(userRole)

	const db = c.get(`drizzle`)

	const currentReports = await db.query.reports.findMany({
		where: eq(schema.reports.projectId, projectScope),
	})

	if (currentReports.length >= numberOfReportsAllowed) {
		return c.json({ error: `You may not create more reports` }, 401)
	}

	const jsonPayload = await c.req.json()
	console.log({ jsonPayload })
	const payloadOut = reporterPutType(jsonPayload)

	if (payloadOut instanceof type.errors) {
		return c.json({ error: `Bad request`, typeErrors: payloadOut.summary }, 400)
	}

	const coverageMapString = stringify(createCoverageMap(payloadOut.mapData))
	const summaryReportString = stringify(payloadOut.jsonSummary)

	await db
		.insert(schema.reports)
		.values({
			ref: reportRef,
			projectId: projectScope,
			data: coverageMapString,
			jsonSummary: summaryReportString,
		})
		.onConflictDoUpdate({
			target: [schema.reports.ref, schema.reports.projectId],
			set: {
				data: coverageMapString,
				jsonSummary: summaryReportString,
			},
		})

	return c.json({ success: true })
})

const locationSchema: Type<Location> = type({
	line: `number.integer`,
	column: `number.integer`,
})

// Reusable schema for a source code location (start/end)
const rangeSchema: Type<Range> = type({
	start: locationSchema,
	end: locationSchema,
})

// Coverage data for one file
const coverageMapEntrySchema: Type<FileCoverageData> = type({
	path: `string`,
	statementMap: { "[string]": rangeSchema },
	fnMap: {
		"[string]": {
			name: `string`,
			line: `number.integer`,
			decl: rangeSchema,
			loc: rangeSchema,
		},
	},
	branchMap: {
		"[string]": {
			line: `number.integer`,
			type: `string`,
			locations: type(rangeSchema, `[]`),
			loc: rangeSchema,
		},
	},
	// s, f, and b track how many times statements/functions/branches were hit
	s: { "[string]": `number.integer` },
	f: { "[string]": `number.integer` },
	b: { "[string]": `number.integer[]` },
})

// A coverage map is a record keyed by file path
export const istanbulCoverageMapDataType: Type<CoverageMapData> = type({
	"[string]": coverageMapEntrySchema,
})

export const coverageEvalType: Type<CoverageEval> = type({
	total: `number.integer`,
	covered: `number.integer`,
	skipped: `number.integer`,
	pct: `number`,
})

export const jsonSummaryType: Type<CoverageSummary> = type({
	branches: coverageEvalType,
	functions: coverageEvalType,
	lines: coverageEvalType,
	statements: coverageEvalType,
})

export const jsonSummaryReportType: Type<JsonSummary> = type({
	total: jsonSummaryType,
	"[string]": jsonSummaryType,
})

export const reporterPutType = type({
	mapData: istanbulCoverageMapDataType,
	jsonSummary: jsonSummaryReportType,
})
