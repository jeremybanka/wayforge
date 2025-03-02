import { type } from "arktype"
import { Hono } from "hono"
import { nanoid } from "nanoid"

import type { Env } from "./env"
import { Project } from "./project"
import * as Schema from "./schema"

const uiRoutes = new Hono<Env>()

uiRoutes.post(`/project`, async (c) => {
	const db = c.get(`drizzle`)
	const formData = await c.req.formData()
	const name = type(`string`)(formData.get(`name`))
	const userId = Number(type(`string`)(formData.get(`userId`)))

	if (name instanceof type.errors) {
		console.log(`returning creation form`)
		return c.html(
			<form hx-post="/ui/project" hx-swap="outerHTML">
				<input name="userId" type="hidden" value={userId} />
				<label>
					Project name:
					<input type="text" name="name" />
				</label>
				<button type="submit">Submit</button>
			</form>,
		)
	}
	const project = (
		await db
			.insert(Schema.projects)
			.values({ userId, name, id: nanoid() })
			.returning()
	)[0]
	return c.html(<Project {...project} />)
})

export default uiRoutes
