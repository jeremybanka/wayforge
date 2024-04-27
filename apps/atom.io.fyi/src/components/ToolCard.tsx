import type { ReactNode } from "react"
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight"

const TYPE_LETTERS = {
	class: `c`,
	function: `f`,
}

export type ToolProps = {
	name: string
	type: `class` | `function`
	description: string
	usage: string
}

export function ToolCard({
	name,
	type,
	description,
	usage,
}: ToolProps): ReactNode {
	return (
		<section>
			<header>
				<span>{name}</span>
				<span>{TYPE_LETTERS[type]}</span>
			</header>
			<div />
			<main>
				<p>{description}</p>
				<SyntaxHighlighter language="tsx" useInlineStyles={false}>
					{usage}
				</SyntaxHighlighter>
			</main>
		</section>
	)
}
