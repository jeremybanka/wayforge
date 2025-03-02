import { css } from "hono/css"

export type DivProjectProps = {
	id: string
	name: string
}
export function Project({ id, name }: DivProjectProps): JSX.Element {
	return (
		<div
			key={id}
			className={css`
				border: 1px solid black;
				padding: 10px;
			`}
		>
			<a href={`/project/${id}`}>{name}</a>
		</div>
	)
}
