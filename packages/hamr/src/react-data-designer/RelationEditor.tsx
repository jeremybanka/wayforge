import "./relation-editor-styles.scss"

import { Id } from "hamr/react-id"

import type { Join } from "~/packages/anvl/src/join"

import type { DataDesigner } from "./DataDesigner"

export const RelationEditor: DataDesigner<Join, `Tree`> = (props) => {
	const seen = new Set()
	const data = Object.entries(props.data.relations)
		.sort(([_, a], [__, b]) => b.length - a.length)
		.filter(([head, tail]) => {
			if (seen.has(head)) return false
			seen.add(head)
			for (const tailElement of tail) {
				seen.add(tailElement)
			}
			return true
		})

	return (
		<article className="relation-editor-0123456789">
			{/* <span>{props.data.relationType}</span> */}
			{data.map(([head, tail]) => (
				<section key={head}>
					<span>
						<Id id={head} />
					</span>
					:
					<span>
						{tail.map((child) => (
							<Id key={`${head}-${child}`} id={child} />
						))}
					</span>
				</section>
			))}
		</article>
	)
}
