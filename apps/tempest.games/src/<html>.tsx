import type { VNode } from "preact"
import * as Script from "./scripts.gen"
import * as Style from "./styles.gen"

export function body(props: { children: any }): VNode {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: This is a trusted script
					dangerouslySetInnerHTML={{ __html: JSON.parse(Script.htmxMinJS) }}
				/>
				<style>{Style.main}</style>
				<title>TEMPEST</title>
			</head>
			<body>{props.children}</body>
		</html>
	)
}
