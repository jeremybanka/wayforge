import { css } from "hono/css"

import * as h4 from "./h4"

export type DivProjectProps = {
	id: string
	name: string
	tokens: DivProjectTokenProps[]
}
export function Project({ id, name, tokens }: DivProjectProps): JSX.Element {
	return (
		<div
			key={id}
			class={css`
				border: 1px solid black;
				padding: 10px;
				background: #fbfbfb;
				box-shadow: 0 4px 0 -2px #0003;
			`}
		>
			<h3
				class={css`
					margin: 0;
				`}
			>
				{name}
			</h3>
			<h4.diagonals>Reports</h4.diagonals>
			<div
				class={css`
					display: flex;
					flex-flow: row wrap;
					gap: 10px;
				`}
			>
				<span
					class={css`
						background:transparent;
						background-color: #f3f3f3;
						box-shadow: inset 0 1px 0 1px #0002;
						border: 1px solid #777;
						padding: 5px;
						height: 30px;
						width: 80px;
					`}
				/>
				<span
					class={css`
						background: transparent;
						border: 1px solid #ddd;
						padding: 5px;
						height: 30px;
						width: 80px;
					`}
				/>
			</div>
			<h4.diagonals>{tokens.length === 0 ? `No Tokens` : `Tokens`}</h4.diagonals>
			{tokens.map((token) => (
				<ProjectToken key={token.id} {...token} />
			))}
			<form
				class={css`
					margin-block-end: 0;
			`}
				hx-post="/ui/token"
				hx-swap="beforebegin"
			>
				<input name="projectId" type="hidden" value={id} />
				<button
					class={css`
						background-color: #fff;
						box-shadow: 0 3px 0 -2px #0003;
						border: 1px solid black;
						padding: 10px;
					`}
					type="submit"
				>
					+ New token
				</button>
			</form>
		</div>
	)
}

export type DivProjectTokenProps = {
	id: string
	name: string
	secretShownOnce?: string
}
export function ProjectToken({
	id,
	name,
	secretShownOnce,
}: DivProjectTokenProps): JSX.Element {
	return (
		<div
			key={id}
			class={css`
				border: 1px solid black;
				padding: 10px;
				background-color: #fff;
				box-shadow: 0 4px 0 -2px #0003;
			`}
		>
			<h3
				class={css`
					margin: 0;
				`}
			>
				{name}
			</h3>
			{secretShownOnce && (
				<div
					class={css`
						background-color: #fff;
						box-shadow: 0 3px 0 -2px #0003;
						border: 1px solid black;
						padding: 10px;
					`}
				>
					<code>{secretShownOnce}</code>
				</div>
			)}
		</div>
	)
}
