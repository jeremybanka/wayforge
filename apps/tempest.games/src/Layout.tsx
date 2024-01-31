import { raw } from "hono/html"
import type { HtmlEscapedString } from "hono/utils/html"

import * as Script from "./scripts.gen"

export const Layout = (props: { children: any }): HtmlEscapedString =>
	raw(`
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script>${JSON.parse(Script.htmxMinJS)}</script>
      <script>${JSON.parse(Script.hyperScriptMinJS)}</script>
      <title>TEMPEST</title>
    </head>
    <body>
			${props.children}
    </body>
  </html>`)
