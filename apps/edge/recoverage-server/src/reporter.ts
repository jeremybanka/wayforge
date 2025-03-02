import { and, eq } from "drizzle-orm"
import type { MiddlewareHandler } from "hono"
import { Hono } from "hono"

import type { Env } from "./env"
import * as Schema from "./schema"

const reporterRoutes = new Hono<Env>()

// Helper to compute SHA-256 hash
async function computeHash(verifier: string) {
	const hashBuffer = await crypto.subtle.digest(
		`SHA-256`,
		new TextEncoder().encode(verifier),
	)
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, `0`))
		.join(``)
}

const reporterAuth: MiddlewareHandler<Env> = async (c, next) => {
	const authHeader = c.req.header(`Authorization`)
	if (!authHeader?.startsWith(`Bearer `)) {
		return c.json({ error: `Unauthorized` }, 401)
	}
	const token = authHeader.slice(7) // Remove "Bearer "
	const [selector, verifier] = token.split(`.`)
	if (!selector || !verifier) {
		return c.json({ error: `Invalid token format` }, 401)
	}
	const db = c.get(`drizzle`)
	const tokenRecord = await db
		.select()
		.from(Schema.tokens)
		.where(eq(Schema.tokens.selector, selector))
		.get() // Use .get() for single row in Drizzle with D1
	if (!tokenRecord) {
		return c.json({ error: `Token not found` }, 401)
	}
	const hash = await computeHash(verifier)
	if (hash !== tokenRecord.verifierHash) {
		return c.json({ error: `Invalid token` }, 401)
	}
	c.set(`projectId`, tokenRecord.projectId)
	await next()
}

// GET /api/report: Retrieve the default report
reporterRoutes.get(`/:projectId`, reporterAuth, async (c) => {
	const projectId = c.req.param(`projectId`)
	const userId = c.get(`projectId`)
	const db = c.get(`drizzle`)
	const project = await db
		.select()
		.from(Schema.projects)
		.where(
			and(eq(Schema.projects.userId, userId), eq(Schema.projects.id, projectId)),
		)
		.get()
	if (!project) {
		return c.json({ error: `No project found` }, 404)
	}
	const report = await db
		.select()
		.from(Schema.reports)
		.where(eq(Schema.reports.projectId, projectId))
		.get()
	if (!report) {
		return c.json({ error: `No default report found` }, 404)
	}
	const data = JSON.parse(report.data)
	return c.json(data)
})

// PUT /api/report: Upload or update the default report
reporterRoutes.put(`/:projectId`, reporterAuth, async (c) => {
	const userId = c.get(`projectId`)
	const data = await c.req.json()
	const jsonData = JSON.stringify(data)
	const db = c.get(`drizzle`)
	// const existingReport = await db
	// 	.select()
	// 	.from(Schema.reports)
	// 	.where(eq(Schema.reports.userId, userId))
	// 	.all()
	// if (existingReport) {
	// 	await db
	// 		.update(Schema.reports)
	// 		.set({ data: jsonData })
	// 		.where(eq(Schema.reports.id, existingReport.id))
	// 		.run()
	// } else {
	// 	const id = crypto.randomUUID()
	// 	await db.insert(Schema.reports).values({ id, userId, data: jsonData }).run()
	// }
	return c.json({ success: true })
})

export default reporterRoutes
