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
	return <div>{doc.name}</div>
}
