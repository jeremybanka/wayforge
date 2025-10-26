import type { VNode } from "preact"
import * as React from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"

type CodeBlockProps = {
	filepath: string
	children: string
}
export function CodeBlock({ filepath, children }: CodeBlockProps): VNode {
	const myRef = React.useRef<HTMLSpanElement>(null)
	React.useEffect(() => {
		const me = myRef.current
		if (me === null) {
			return
		}
		const myElementsWithClassNameStringAndContainingDoubleQuotes =
			Array.prototype.filter.call(
				me.querySelectorAll(`.token.string`),
				(element: any) => element.textContent.includes(`./`),
			)

		console.log({ filepath })
		if (filepath === `declare-an-atom.ts`) {
			console.log({ myElementsWithClassNameStringAndContainingDoubleQuotes })
		}
		for (const element of myElementsWithClassNameStringAndContainingDoubleQuotes) {
			// get everything following the final '/'
			const href = `#` + element.textContent.split(`/`).pop()
			element.innerHTML = `<a href="${href}">${element.textContent}</a>`
		}
	}, [myRef.current])
	return (
		<span className="codeblock" id={filepath.split(`.`)[0]} ref={myRef}>
			<header>
				<span>{filepath}</span>
				<button
					type="button"
					onClick={async () => {
						await navigator.clipboard.writeText(children)
					}}
				>
					<svg viewBox="0 0 16 16">
						<title>copy</title>
						<path
							d="M15,5v10H5V5h10M16,4H4v12h12V4h0Z"
							fill="var(--icon-color)"
						/>
						<polygon
							points="3 11 1 11 1 1 11 1 11 3 12 3 12 0 0 0 0 12 3 12 3 11"
							fill="var(--icon-color)"
						/>
					</svg>
				</button>
			</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{children}
			</SyntaxHighlighter>
		</span>
	)
}
