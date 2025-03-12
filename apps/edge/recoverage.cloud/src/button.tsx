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
        background: ${disabled ? `transparent` : `var(--color-bg-t3)`};
        box-shadow: ${disabled ? `none` : `0 3px 0 -2px #0003`};
        color: ${disabled ? `var(--color-fg-superlight)` : `var(--color-fg)`};
        border: ${disabled ? `1px solid var(--color-fg-superlight)` : `1px solid var(--color-fg)`};
        padding: 10px;
        justify-self: left;
        align-self: flex-start;
        border-radius: 0px 0 5px 0;
        &:active {
          background-color: var(--bg-color-s2);
          box-shadow: inset 0 1px 0 1px #0002;
        }
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
				font-size: 15px;
        background-color: ${disabled ? `transparent` : `var(--color-bg-t3)`};
        box-shadow: ${disabled ? `none` : `0 3px 0 -2px #0003`};
        color: ${disabled ? `var(--color-fg-superlight)` : `var(--color-fg)`};
        border: 1px solid ${disabled ? `var(--color-fg-superlight)` : `var(--color-fg)`};
        padding: 6px 10px 7px;
        justify-self: left;
        align-self: flex-start;
        border-radius: 0 0 0 5px;
        &:active {
          background-color: var(--bg-color-s2);
          box-shadow: inset 0 1px 0 1px #0002;
        }
      `}
		>
			×
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
        background-color: ${disabled ? `transparent` : `var(--color-bg-t3)`};
        box-shadow: ${disabled ? `none` : `0 3px 0 -2px #0003`};
        color: ${disabled ? `var(--color-fg-superlight)` : `var(--color-fg)`};
        border: 1px solid ${disabled ? `var(--color-fg-superlight)` : `var(--color-fg)`};
        padding: 10px;
        justify-self: left;
        align-self: flex-start;
        border-radius: 5px 0 5px 0;
        &:active {
          background-color: var(--bg-color-s2);
          box-shadow: inset 0 1px 0 1px #0002;
        }
      `}
		>
			copy
		</button>
	)
}

export type SubmitProps = {
	children?: string
	disabled?: boolean
}
export function submit(props: SubmitProps): JSX.Element {
	const { disabled } = props
	return (
		<button
			type="submit"
			class={css`
        background-color: var(--color-bg-t3);
        box-shadow: 0 3px 0 -2px #0003;
				color: ${disabled ? `var(--color-fg-superlight)` : `var(--color-fg)`};
        border: 1px solid ${disabled ? `var(--color-fg-superlight)` : `var(--color-fg)`};
        padding: 10px;
        border-radius: 0 0 5px 0;
        &:active {
          background-color: var(--bg-color-s2);
          box-shadow: inset 0 1px 0 1px #0002;
        }
      `}
		>
			{props.children ?? `Submit`}
		</button>
	)
}
