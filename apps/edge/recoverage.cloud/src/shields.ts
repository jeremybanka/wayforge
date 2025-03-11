import { and, eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { Hono } from "hono"
import type { MiddlewareHandler } from "hono/types"

import { createDatabase } from "./db"
import type { Bindings } from "./env"
import { parse, stringify } from "./json"
import * as schema from "./schema"

type ShieldsEnv = {
	Bindings: Bindings
	Variables: {
		drizzle: DrizzleD1Database<typeof schema>
	}
}
export const shieldsRoutes = new Hono<ShieldsEnv>()

export type ShieldsData = {
	schemaVersion: 1
	label: string
	message: string
	color?: string
	labelColor?: string
	isError?: boolean
	namedLogo?: string
	logoColor?: string
	logoSize?: string
	style?: string
}

const shieldsMiddleware: MiddlewareHandler<ShieldsEnv> = async (c, next) => {
	c.set(`drizzle`, createDatabase(c.env.DB))
	await next()
}

shieldsRoutes.get(`/:projectId/:reportRef`, shieldsMiddleware, async (c) => {
	const projectId = c.req.param(`projectId`)
	const reportRef = c.req.param(`reportRef`)
	const db = c.get(`drizzle`)
	const summaryString = (
		await db.query.reports.findFirst({
			columns: { jsonSummary: true },
			where: and(
				eq(schema.reports.projectId, projectId),
				eq(schema.reports.ref, reportRef),
			),
		})
	)?.jsonSummary //?? stringify(jsonSummaryFixture)
	if (!summaryString) {
		return c.json({ error: `No report found` }, 404)
	}
	const summary = parse(summaryString)
	console.log(summary)
	const coveragePct = summary.total.statements.pct
	const thresholds = [
		[90, `brightgreen`],
		[75, `yellow`],
		[50, `orange`],
		[0, `red`],
	] as const
	const threshold = thresholds.find(([pct]) => coveragePct >= pct)
	if (!threshold) {
		return c.json({ error: `No threshold found` }, 500)
	}
	const [_, color] = threshold
	c.header(`Content-Type`, `application/json`)
	const body = Object.assign(
		{
			schemaVersion: 1,
			color,
			style: `for-the-badge`,
		} as const,
		coveragePct === 100
			? { label: ``, message: `coverage 100%` }
			: { label: `coverage`, message: `${coveragePct}%` },
	) satisfies ShieldsData

	return c.body(stringify(body))
})
