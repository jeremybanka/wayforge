import { type } from "arktype"
import { and, eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import type { MiddlewareHandler } from "hono"
import { Hono } from "hono"

import { createDatabase } from "./db"
import type { Bindings } from "./env"
import { computeHash } from "./hash"
import * as schema from "./schema"

type ReporterEnv = {
	Bindings: Bindings
	Variables: {
		drizzle: DrizzleD1Database<typeof schema>
		projectScope: string
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
	const tokenRecord = await db
		.select({
			projectId: schema.tokens.projectId,
			salt: schema.tokens.salt,
			hash: schema.tokens.hash,
		})
		.from(schema.tokens)
		.where(eq(schema.tokens.id, id))
		.get()
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
	await next()
}

reporterRoutes.get(`/:reportId`, reporterAuth, async (c) => {
	const reportId = c.req.param(`reportId`)
	const projectScope = c.get(`projectScope`)
	const db = c.get(`drizzle`)
	const report = await db.query.reports.findFirst({
		where: and(
			eq(schema.reports.projectId, projectScope),
			eq(schema.reports.id, reportId),
		),
	})
	if (!report) {
		return c.json({ error: `No report found` }, 404)
	}
	c.header(`Content-Type`, `application/json`)
	return c.body(report.data)
})

reporterRoutes.put(`/:reportId`, reporterAuth, async (c) => {
	const projectScope = c.get(`projectScope`)
	const reportId = c.req.param(`reportId`)
	const data = await c.req.json()
	const out = istanbulCoverageMapType(data)

	if (out instanceof type.errors) {
		console.log(out)
		return c.json({ error: `Invalid report: ${out.issues}` }, 400)
	}

	const db = c.get(`drizzle`)

	await db.insert(schema.reports).values({
		id: reportId,
		projectId: projectScope,
		data: JSON.stringify(out),
	})

	return c.json({ success: true })
})

// Reusable schema for a source code location (start/end)
const locationSchema = type({
	start: { line: `number.integer`, column: `number.integer` },
	end: { line: `number.integer`, column: `number.integer` },
})

// Coverage data for one file
const coverageMapEntrySchema = type({
	path: `string`,
	all: `boolean`,
	statementMap: { "[string]": locationSchema },
	fnMap: {
		"[string]": {
			name: `string`,
			decl: locationSchema,
			loc: locationSchema,
		},
	},
	branchMap: {
		"[string]": {
			line: `number.integer`,
			type: `string`,
			locations: type(locationSchema, `[]`),
		},
	},
	// s, f, and b track how many times statements/functions/branches were hit
	s: { "[string]": `number.integer` },
	f: { "[string]": `number.integer` },
	b: { "[string]": `number.integer[]` },
})

// A coverage map is a record keyed by file path
export const istanbulCoverageMapType = type({
	"[string]": coverageMapEntrySchema,
})
