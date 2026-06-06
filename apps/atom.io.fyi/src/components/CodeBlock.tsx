import { type ComponentChildren, toChildArray, type VNode } from "preact"
import * as React from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"

type CodeBlockProps = {
	filepath?: string
	label?: string
	code?: string
	soft?: boolean
	children?: ComponentChildren
}

function getLanguage(filepath?: string): string {
	if (!filepath) {
		return `tsx`
	}
	const extension = filepath.split(`.`).pop()
	switch (extension) {
		case `sh`:
			return `bash`
		case `ts`:
			return `ts`
		case `tsx`:
			return `tsx`
		case `js`:
			return `javascript`
		case `jsx`:
			return `jsx`
		case undefined:
			return `tsx`
		default:
			return `tsx`
	}
}

function getCodeBlockId(label: string): string {
	return label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, `-`)
		.replace(/^-+|-+$/g, ``)
}

function flattenChildrenToString(children: ComponentChildren): string {
	return toChildArray(children)
		.map((child) => {
			if (typeof child === `string` || typeof child === `number`) {
				return String(child)
			}
			if (Array.isArray(child)) {
				return flattenChildrenToString(child)
			}
			return ``
		})
		.join(``)
}

export function CodeBlock({
	filepath,
	label,
	code: codeProp,
	soft = false,
	children,
}: CodeBlockProps): VNode {
	const myRef = React.useRef<HTMLSpanElement>(null)
	const displayLabel = label ?? filepath ?? `code`
	const code = codeProp ?? flattenChildrenToString(children)

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

		for (const element of myElementsWithClassNameStringAndContainingDoubleQuotes) {
			// get everything following the final '/'
			const href = `#` + element.textContent.split(`/`).pop()
			element.innerHTML = `<a href="${href}">${element.textContent}</a>`
		}
	}, [code, filepath])
	return (
		<span className="codeblock" id={getCodeBlockId(displayLabel)} ref={myRef}>
			<back-fill className={soft ? `soft` : `hard`} />
			<header>
				<span>{displayLabel}</span>
				<button
					type="button"
					onClick={async () => {
						await navigator.clipboard.writeText(code)
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
			<SyntaxHighlighter
				language={getLanguage(filepath)}
				useInlineStyles={false}
			>
				{code}
			</SyntaxHighlighter>
		</span>
	)
}
