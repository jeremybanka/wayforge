import { raw } from "hono/html"
import { Hono } from "hono/quick"

import * as Script from "./scripts.gen"

const Layout = (props: { children: any }) =>
	raw(`
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script>${JSON.parse(Script.htmxMinJS)}</script>
      <script>${JSON.parse(Script.hyperScriptMinJS)}</script>
      <title>Hono + htmx</title>
    </head>
    <body>
			${props.children}
    </body>
  </html>`)

const app = new Hono()
app.get(`/`, (c) => {
	return c.html(
		<Layout>
			<div style={{ color: `red` }}>TEMPEST GAMES®</div>
		</Layout>,
	)
})

app.fire()
