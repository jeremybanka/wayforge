import { css } from "hono/css"

/* eslint-disable quotes */
export type CreateProps = {
	"hx-post": string
	"hx-swap": string
	"hx-target"?: string
	"hx-confirm"?: string
	children: string
	disabled?: boolean | undefined
}
/* eslint-enable quotes */
export function create(props: CreateProps): JSX.Element {
	const { disabled } = props
	return (
		<button
			hx-post={props[`hx-post`]}
			hx-swap={props[`hx-swap`]}
			type="button"
			class={css`
        background: ${disabled ? `transparent` : `#fff`};
        box-shadow: ${disabled ? `none` : `0 3px 0 -2px #0003`};
        color: ${disabled ? `#aaa` : `black`};
        border: ${disabled ? `1px solid #aaa` : `1px solid black`};
        padding: 10px;
        justify-self: left;
        align-self: flex-start;
      `}
		>
			{props.children}
		</button>
	)
}

/* eslint-disable quotes */
export type XProps = {
	"hx-delete": string
	"hx-target"?: string
	"hx-confirm"?: string
	"hx-swap"?: string
	disabled?: boolean
}
/* eslint-enable quotes */
export function x(props: XProps): JSX.Element {
	const { disabled } = props
	return (
		<button
			hx-delete={props[`hx-delete`]}
			hx-target={props[`hx-target`]}
			hx-confirm={props[`hx-confirm`]}
			hx-swap={props[`hx-swap`]}
			type="button"
			class={css`
        background-color: ${disabled ? `transparent` : `#fff`};
        box-shadow: ${disabled ? `none` : `0 3px 0 -2px #0003`};
        color: ${disabled ? `#aaa` : `black`};
        border: 1px solid #aaa;
        padding: 10px;
        justify-self: left;
        align-self: flex-start;
      `}
		>
			x
		</button>
	)
}

export type CopyProps = {
	text: string
	disabled?: boolean
}

export function copy({ disabled, text }: CopyProps): JSX.Element {
	return (
		<button
			hx-on:click={`navigator.clipboard.writeText('${text}')
    .then(() => alert('Copied!'))
    .catch(err => alert('Copy failed: ' + err))`}
			type="button"
			class={css`
        background-color: ${disabled ? `transparent` : `#fff`};
        box-shadow: ${disabled ? `none` : `0 3px 0 -2px #0003`};
        color: ${disabled ? `#aaa` : `black`};
        border: 1px solid #aaa;
        padding: 10px;
        justify-self: left;
        align-self: flex-start;
      `}
		>
			copy
		</button>
	)
}
