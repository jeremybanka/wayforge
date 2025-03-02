import { css, Style } from "hono/css"
import type { PropsWithChildren } from "hono/jsx"

import * as Script from "./scripts.gen"

export function Html(props: PropsWithChildren): JSX.Element {
	return (
		<html
			lang="en"
			className={css`
        background-color: #eee;
      `}
		>
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<link rel="preload" href="/noise.svg" as="image" type="image/svg+xml" />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: This is a trusted script
					dangerouslySetInnerHTML={{ __html: JSON.parse(Script.htmxMinJS) }}
				/>
				<title>Recoverage</title>
				<Style />
			</head>
			<body
				className={css`
            background-color: #fcfcfc;
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
