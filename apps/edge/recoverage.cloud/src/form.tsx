import { css } from "hono/css"

import * as button from "./button"
import * as header from "./header"

/* eslint-disable quotes */
export type NamerProps = {
	header: string
	"hx-post": string
	"hx-swap": string
	"hx-target"?: string
	"hx-confirm"?: string
}
/* eslint-enable quotes */
export function namer(props: NamerProps): JSX.Element {
	return (
		<form
			{...props}
			class={css`
        background: var(--color-bg-t3);
        border: 1px solid var(--color-fg-light);
        padding: 10px;
        display: flex;
        flex-flow: column;
        gap: 5px;
        margin-block-end: 0;
        border-radius: 10px 0 10px 0;
      `}
		>
			<header.mini>{props.header}</header.mini>
			<main
				class={css`
          display: flex;
          flex-flow: row;
          gap: 5px;
        `}
			>
				<input
					type="text"
					name="name"
					placeholder="name"
					class={css`
          width: 100%;
          font-size: 16px;
          border: 1px solid var(--color-fg);
          padding: 10px;
          box-shadow: inset 0 1px 0 1px #0002;
					color: var(--color-fg);
          background: var(--color-bg);
        `}
				/>
				<button.submit />
			</main>
		</form>
	)
}
