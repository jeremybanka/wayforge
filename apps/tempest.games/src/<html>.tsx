import { raw } from "hono/html"
import type { HtmlEscapedString } from "hono/utils/html"

import * as Script from "./scripts.gen"
import * as Style from "./styles.gen"

export function body(props: { children: any }): HtmlEscapedString {
	return raw(`
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script>${JSON.parse(Script.htmxMinJS)}</script>
      <script>${JSON.parse(Script.hyperScriptMinJS)}</script>
      <style>${Style.main}</style>
      <title>TEMPEST</title>
    </head>
    <body>
			${props.children}
    </body>
  </html>`)
}
