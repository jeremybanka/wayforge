import type { Join } from "~/packages/anvl/src/join"

import type { DataDesigner } from "./DataDesigner"
import scss from "./RelationEditor.module.scss"
import { Id } from "../react-id"

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
		<article className={scss.class}>
			{/* <span>{props.data.relationType}</span> */}
			{data.map(([head, tail]) => (
				<section>
					<span>
						<Id id={head} />
					</span>
					:
					<span>
						{tail.map((child) => (
							<Id id={child} />
						))}
					</span>
				</section>
			))}
		</article>
	)
}
