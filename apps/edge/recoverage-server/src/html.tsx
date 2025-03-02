import { css, Style } from "hono/css"

import * as Script from "./scripts.gen"

export function Html(props: { children: any }): JSX.Element {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: This is a trusted script
					dangerouslySetInnerHTML={{ __html: JSON.parse(Script.htmxMinJS) }}
				/>
				<title>Recoverage</title>
				<Style />
			</head>
			<body
				className={css`
            display: flex;
            margin: 0;
            padding: 10px;
            box-sizing: border-box;
            flex-direction: column;
            min-height: 100svh;
            font-family: sans-serif;
            justify-items: center;
          `}
			>
				{props.children}
			</body>
		</html>
	)
}
