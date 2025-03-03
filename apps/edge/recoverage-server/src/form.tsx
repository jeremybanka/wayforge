import { css } from "hono/css"

/* eslint-disable quotes */
export type NamerProps = {
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
        border: 1px solid black;
        padding: 10px;
        display: flex;
        flex-flow: row;
        gap: 10px;
      `}
		>
			<input
				type="text"
				name="name"
				placeholder="name"
				class={css`
          flex-grow: 1;
          font-size: 16px;
          border: 1px solid black;
          padding: 10px;
          box-shadow: inset 0 1px 0 1px #0002;
          background-color: #f6f6f6;
        `}
			/>
			<button
				type="submit"
				class={css`
          background-color: #fff;
          box-shadow: 0 3px 0 -2px #0003;
          border: 1px solid black;
          padding: 10px;
        `}
			>
				Submit
			</button>
		</form>
	)
}
