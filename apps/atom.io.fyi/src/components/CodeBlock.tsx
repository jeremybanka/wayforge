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
			<header>{filepath}</header>
			<SyntaxHighlighter language="tsx" useInlineStyles={false}>
				{children}
			</SyntaxHighlighter>
		</span>
	)
}
