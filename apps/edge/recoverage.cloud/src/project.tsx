import { css } from "hono/css"

import * as button from "./button"
import * as form from "./form"
import * as h4 from "./h4"
import * as header from "./header"

export type DivProjectProps =
	| {
			id: string
			name: string
			tokens: CompleteProjectTokenProps[]
			mode: `deleted` | `existing`
	  }
	| {
			mode: `button` | `creator`
	  }
export function Project(props: DivProjectProps): JSX.Element {
	switch (props.mode) {
		case `button`: {
			return (
				<button.create hx-post="/ui/project" hx-swap="beforebegin">
					+ New project
				</button.create>
			)
		}
		case `creator`: {
			return (
				<form.namer hx-post="/ui/project" hx-swap="outerHTML" header="project" />
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
					background: ${mode === `deleted` ? `var(--color-bg-s2)` : ``};
					box-shadow: ${mode === `deleted` ? `inset` : ``} 0 4px 0 -2px #0003;
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
						<span>
							<header.mini>project</header.mini>
							<h3
								class={css`
								margin: 0;
								margin-top: 5px;
							`}
							>
								{name}
							</h3>
						</span>

						<button.x
							hx-delete={`/ui/project/${id}`}
							hx-target={`#project-${id}`}
							hx-swap="outerHTML"
							hx-confirm={`Delete project "${name}"?`}
							disabled={mode === `deleted`}
						/>
					</header>
					<section
						class={css`
							display: flex;
							flex-flow: column;
							gap: 10px;
						`}
					>
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
									background-color: var()(--color-bg-s1);								
									box-shadow: inset 0 1px 0 1px #0002;
									border: 1px solid var(--color-fg-light);
									padding: 5px;
									height: 30px;
									width: 80px;
								`}
							/>
							<span
								class={css`
									background: transparent;
									border: 1px solid var(--color-fg-faint);
									padding: 5px;
									height: 30px;
									width: 80px;
								`}
							/>
						</div>
					</section>

					<section
						class={css`
							display: flex;
							flex-flow: column;
							gap: 10px;
						`}
					>
						<h4.diagonals>
							{tokens.length === 0 ? `No Tokens` : `Tokens`}
						</h4.diagonals>
						{tokens.map((token) => (
							<ProjectToken key={token.id} {...token} />
						))}
						<ProjectToken
							mode="button"
							projectId={id}
							disabled={mode === `deleted`}
						/>
						{/* <ProjectToken mode="creator" projectId={id} />
						<ProjectToken
							mode="existing"
							id={id}
							name="Existing Token"
							secretShownOnce="secret"
						/>
						<ProjectToken mode="deleted" id={id} name="Existing Token" /> */}
					</section>
				</div>
			)
		}
	}
}

export type CompleteProjectTokenProps = {
	id: string
	name: string
	secretShownOnce?: string
	mode?: `deleted` | `existing`
}

export type DivProjectTokenProps =
	| CompleteProjectTokenProps
	| {
			mode: `button` | `creator`
			disabled?: boolean
			projectId: string
	  }
export function ProjectToken(props: DivProjectTokenProps): JSX.Element {
	switch (props.mode) {
		case `button`: {
			const { projectId, disabled } = props
			return (
				<button.create
					hx-post={`/ui/token/${projectId}`}
					hx-swap="beforebegin"
					disabled={disabled}
				>
					+ New token
				</button.create>
			)
		}
		case `creator`: {
			const { projectId } = props
			return (
				<form.namer
					hx-post={`/ui/token/${projectId}`}
					hx-swap="outerHTML"
					header="token"
				/>
			)
		}
		case undefined:
		case `existing`:
		case `deleted`: {
			const { id, name, secretShownOnce, mode } = props
			return (
				<div
					key={id}
					id={`project-${id}`}
					class={css`
						display: flex;
						flex-flow: column;
						gap: 5px;
						border: 1px solid black;
						padding: 10px;
						background: ${mode === `deleted` ? `#eee` : `#fff`};
						box-shadow: ${mode === `deleted` ? `inset` : ``} 0 4px 0 -2px #0003;
						border-radius: 10px 0 10px 0;
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
						<span>
							<header.mini>token</header.mini>
							<h5 class={css`margin: 0; margin-top: 5px;`}>
								{name}
								{` `}
								{mode === `deleted` ? (
									<span class={css`font-size: 14px; font-weight: 400;`}>
										(deleted)
									</span>
								) : null}
							</h5>
						</span>
						<span class={css`flex-grow: 1;`} />
						<button.x
							hx-delete={`/ui/token/${id}`}
							hx-target={`#project-${id}`}
							hx-swap="outerHTML"
							hx-confirm={`Delete token "${name}"?`}
							disabled={mode === `deleted`}
						/>
					</header>
					{secretShownOnce && (
						<>
							<div
								class={css`
								display: flex;
								flex-flow: row;
								gap: 10px;
								background: #0f02;
								box-shadow: 0 3px 0 -2px #0003;
								border: 2px dotted green;
								padding: 10px;
								align-items: center;
							`}
							>
								<span class={css`flex-grow: 1;`}>
									<code class={css`font-size: 18px; color: green;`}>
										{id}.{secretShownOnce}
									</code>
								</span>
								<button.copy text={secretShownOnce} />
							</div>
							<div class={css`font-size: 12px;`}>
								^ copy this code and put it somewhere safe. it will not be shown
								again.
							</div>
						</>
					)}
				</div>
			)
		}
	}
}
