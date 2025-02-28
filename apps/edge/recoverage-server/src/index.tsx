// const app = new Hono()
// app.use(renderer)
// app.get(`/`, (c) => {
// 	return c.render(<h1>Hello!</h1>)
// })
// export default app
import { eq } from "drizzle-orm"
import type { DrizzleD1Database } from "drizzle-orm/d1"
import { drizzle } from "drizzle-orm/d1"
import type { Context, Next } from "hono"
import { Hono } from "hono"

import { renderer } from "./renderer"
import * as Schema from "./schema"

type Bindings = {
	DB: D1Database
}
type Variables = {
	renderer: typeof renderer
	drizzle: DrizzleD1Database<typeof Schema>
	userId: number
}
type Env = { Bindings: Bindings; Variables: Variables }

const app = new Hono<Env>()

app.use(renderer)
app.use(`*`, async (c, next) => {
	c.set(`drizzle`, drizzle<typeof Schema>(c.env.DB))
	await next()
})

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

// API Authentication Middleware
const apiAuth = async (c: Context<Env>, next: Next) => {
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
	c.set(`userId`, tokenRecord.userId)
	await next()
}

// GET /api/report: Retrieve the default report
app.get(`/api/report`, apiAuth, async (c) => {
	const userId = c.get(`userId`)
	const db = c.get(`drizzle`)
	const report = await db
		.select()
		.from(Schema.reports)
		.where(eq(Schema.reports.userId, userId))
		.get()
	if (!report) {
		return c.json({ error: `No default report found` }, 404)
	}
	const data = JSON.parse(report.data)
	return c.json(data)
})

// PUT /api/report: Upload or update the default report
app.put(`/api/report`, apiAuth, async (c) => {
	const userId = c.get(`userId`)
	const data = await c.req.json()
	const jsonData = JSON.stringify(data)
	const db = c.get(`drizzle`)
	const existing = await db
		.select()
		.from(Schema.reports)
		.where(eq(Schema.reports.userId, userId))
		.get()
	if (existing) {
		await db
			.update(Schema.reports)
			.set({ data: jsonData })
			.where(eq(Schema.reports.id, existing.id))
			.run()
	} else {
		const id = crypto.randomUUID()
		await db.insert(Schema.reports).values({ id, userId, data: jsonData }).run()
	}
	return c.json({ success: true })
})

// export default {
// 	fetch: app.fetch,
// }
export default app
