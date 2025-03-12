import { css } from "hono/css"
import type { JsonSummary } from "recoverage"

import * as button from "./button"
import * as form from "./form"
import * as h4 from "./h4"
import * as header from "./header"
import type { Json } from "./json"
import { reportsAllowed, type Role, tokensAllowed } from "./roles-permissions"

export type ProjectProps =
	| {
			id: string
			name: string
			tokens: CompleteProjectTokenProps[]
			reports: {
				ref: string
				jsonSummary: Json.stringified<JsonSummary> | null
			}[]
			mode: `deleted` | `existing`
			userRole: Role
	  }
	| {
			mode: `button` | `creator`
			disabled?: boolean
	  }
export function Project(props: ProjectProps): JSX.Element {
	switch (props.mode) {
		case `button`: {
			return (
				<button.create
					hx-post="/ui/project"
					hx-swap="beforebegin"
					disabled={props.disabled}
				>
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
			const { id, name, tokens, reports, mode, userRole } = props
			const numberOfTokensAllowed = tokensAllowed.get(userRole)
			const mayCreateToken = tokens.length < numberOfTokensAllowed
			return (
				<div
					key={id}
					id={`project-${id}`}
					class={css`
					border: 1px solid var(--color-fg-light);
					padding: 10px;
					padding-bottom: 12px;
					background: ${mode === `deleted` ? `var(--color-bg-s2)` : `var(--color-bg-t2)`};
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
								{` `}
								{mode === `deleted` ? (
									<span
										class={css`font-size: 14px; font-weight: 400; color: var(--color-fg-light);`}
									>
										(deleted)
									</span>
								) : null}
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
							{Array.from({ length: reportsAllowed.get(userRole) }).map(
								(_, idx) => {
									const report = reports[idx]
									if (!report) {
										return (
											<span
												class={css`
												background: transparent;
												border: 1px solid var(--color-fg-faint);
												padding: 5px;
												box-sizing: border-box;
												height: 46px;
												width: 80px;
												box-shadow: inset 0 1px 0 1px #0002;
											`}
											/>
										)
									}
									let coveragePercent: number | undefined
									if (report?.jsonSummary) {
										const summary = JSON.parse(report.jsonSummary)
										coveragePercent = summary.total.statements.pct
									}
									return (
										<span
											key={report?.ref ?? idx}
											class={css`
												display: flex;
												box-sizing: border-box;
												flex-flow: column;
												align-items: center;
												justify-content: center;
												background-color: ${mode === `deleted` ? `transparent` : `var(--color-bg-t1)`};
												border: 1px solid ${mode === `deleted` ? `var(--color-fg-faint)` : `var(--color-fg-light)`};
												box-shadow: inset 0 1px 0 1px #0002;
												padding: 2px;
												min-height: 30px;
												min-width: 80px;
												`}
										>
											<span
												class={css`
													position: relative;
													box-sizing: border-box;
													display: flex;
													flex-flow: column;
													align-items: center;
													justify-content: center;
													background:transparent;
													color: ${mode === `deleted` ? `var(--color-fg-faint)` : `var(--color-fg)`};
													background-color: ${mode === `deleted` ? `transparent` : `var(--color-bg-t3)`};						
													border: 1px solid ${mode === `deleted` ? `transparent` : `var(--color-fg-faint)`};
													box-shadow: 0 4px 0 -2px #0003;
													padding: 9px 10px 11px;
													min-width: 80px;
													line-break: none;
												`}
											>
												{report.ref}
												{coveragePercent ? (
													<span
														class={css`
															position: absolute;
															bottom: -12px;
															margin: auto;
															display: inline;
															font-size: 12px;
															color: var(--color-fg-light);
															border-radius: 10px;
															border: 1px solid var(--color-fg-faint);
															background: var(--color-bg-t3);
															padding: 1px 3px 2px 6px;
															box-shadow: 0 2px 0px -1px #0005;
														`}
													>
														{coveragePercent}%
													</span>
												) : null}
											</span>
										</span>
									)
								},
							)}
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
							disabled={mode === `deleted` || !mayCreateToken}
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
						border: 1px solid var(--color-fg-light);
						padding: 10px;
						background: ${mode === `deleted` ? `var(--color-bg-s1)` : `var(--color-bg-t3)`};
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
									<span
										class={css`font-size: 14px; font-weight: 400; color: var(--color-fg-light);`}
									>
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
									<code class={css`font-size: 18px; color: var(--success);`}>
										{id}.{secretShownOnce}
									</code>
								</span>
								<button.copy text={`${id}.${secretShownOnce}`} />
							</div>
							<div class={css`font-size: 12px; text-align: right;`}>
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
