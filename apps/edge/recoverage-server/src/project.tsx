import { css } from "hono/css"

import * as h4 from "./h4"

export type DivProjectProps =
	| {
			id: string
			name: string
			tokens: ExistingProjectTokenProps[]
			mode: `deleted` | `existing`
	  }
	| {
			mode: `button` | `creator`
	  }
export function Project(props: DivProjectProps): JSX.Element {
	switch (props.mode) {
		case `button`: {
			return (
				<form hx-post="/ui/project" hx-swap="beforebegin">
					<button
						class={css`
						background-color: #fff;
						box-shadow: 0 3px 0 -2px #0003;
						border: 1px solid black;
						padding: 10px;
					`}
						type="submit"
					>
						+ New project
					</button>
				</form>
			)
		}
		case `creator`: {
			return (
				<form
					hx-post="/ui/project"
					hx-swap="outerHTML"
					class={css`
								display: flex;
								flex-flow: column;
								gap: 10px;
							`}
				>
					<input type="text" name="name" />
					<button type="submit">Submit</button>
				</form>
			)
		}
		case `existing`:
		case `deleted`: {
			const { id, name, tokens, mode } = props
			return (
				<div
					key={id}
					id={`project-${id}`}
					class={css`
					border: 1px solid black;
					padding: 10px;
					padding-bottom: 12px;
					${(() => {
						switch (mode) {
							case `deleted`:
								return `
								background: #f2f2f2;
								box-shadow: inset 0 4px 0 -2px #0003;
							`
							case `existing`:
								return `
									background: #fbfbfb;
									box-shadow: 0 4px 0 -2px #0003;
								`
						}
					})()}
				
				border-radius: 10px 0px 10px 0px;
			`}
				>
					<header
						class={css`
					display: flex;
					flex-flow: row;
					justify-content: space-between;
					align-items: center;
					gap: 10px;
				`}
					>
						<h3
							class={css`
						margin: 0;
						background: white;
					`}
						>
							{name}
						</h3>
						<button
							type="button"
							hx-delete={`/ui/project/${id}`}
							hx-target={`#project-${id}`}
							hx-swap="outerHTML"
							hx-confirm={`Delete project "${name}"?`}
							class={css`
						background-color: #fff;
						box-shadow: 0 3px 0 -2px #0003;
						border: 1px solid black;
						padding: 10px;
						margin-left: auto;
				`}
							disabled={mode === `deleted`}
						>
							x
						</button>
					</header>
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
						border: 1px solid #888;
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
					<h4.diagonals>
						{tokens.length === 0 ? `No Tokens` : `Tokens`}
					</h4.diagonals>
					{tokens.map((token) => (
						<ProjectToken key={token.id} {...token} />
					))}
					<ProjectToken mode="button" projectId={id} />
				</div>
			)
		}
	}
}

export type ExistingProjectTokenProps = {
	id: string
	name: string
	secretShownOnce?: string
	mode?: `existing`
}

export type DivProjectTokenProps =
	| {
			id: string
			name: string
			secretShownOnce?: string
			mode?: `deleted` | `existing`
	  }
	| {
			mode: `button` | `creator`
			projectId: string
	  }
export function ProjectToken(props: DivProjectTokenProps): JSX.Element {
	switch (props.mode) {
		case `button`: {
			const { projectId } = props
			return (
				<form
					class={css`
					margin-block-end: 0;
			`}
					hx-post={`/ui/token/${projectId}`}
					hx-swap="beforebegin"
				>
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
			)
		}
		case `creator`: {
			const { projectId } = props
			return (
				<form
					hx-post={`/ui/token/${projectId}`}
					hx-swap="outerHTML"
					class={css`
					display: flex;
					flex-flow: column;
					gap: 10px;
				`}
				>
					<input type="text" name="name" />
					<button type="submit">Submit</button>
				</form>
			)
		}
		case undefined:
		case `existing`:
		case `deleted`: {
			const { id, name, secretShownOnce, mode } = props
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
					<h5
						class={css`
					margin: 0;
				`}
					>
						{name}
					</h5>
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
	}
}
