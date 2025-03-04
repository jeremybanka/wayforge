import { css } from "hono/css"

export type MiniHeaderProps = {
	children: string
}
export function mini(props: MiniHeaderProps): JSX.Element {
	return (
		<header
			class={css`
        font-size: 9px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      `}
		>
			{props.children}
		</header>
	)
}
