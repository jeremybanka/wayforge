import type { TSD } from "tsdoc.json"

export type DocsProps = {
	docs: TSD.Doc[]
	className?: string
}
export function Docs({ docs, className = `` }: DocsProps): JSX.Element {
	return (
		<div className={className}>
			{docs.map((doc) => (
				<Doc key={doc.name} doc={doc} />
			))}
			<span>{docs.length}</span>
		</div>
	)
}

export type DocProps = {
	doc: TSD.Doc
}
export function Doc({ doc }: DocProps): JSX.Element {
	return (
		<article>
			<header>
				<span>{doc.name}</span>
				<span>
					{` `}({`kind` in doc ? doc.kind : doc.type})
				</span>
			</header>
			<main>
				{doc.type === `function` && !(`overloads` in doc)
					? doc.sections.map((section) => (
							<div key={JSON.stringify(section)}>
								{section.content.map((p) => (
									<p key={p.content}>{p.content.map((c) => c.text)}</p>
								))}
							</div>
						))
					: null}
			</main>
		</article>
	)
}
