import { Hono } from "hono/quick"
import { Layout } from "./Layout"

const app = new Hono()

app.get(`/`, (c) => {
	return c.html(
		<Layout>
			<div>TEMPEST GAMES®</div>
		</Layout>,
	)
})

app.post(`/`, (c) => {
	return c.json({ message: `POST request received` })
})

app.fire()
