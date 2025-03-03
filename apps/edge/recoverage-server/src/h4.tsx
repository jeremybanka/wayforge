import { css } from "hono/css"
import type { PropsWithChildren } from "hono/jsx"

export function diagonals({ children }: PropsWithChildren): JSX.Element {
	return (
		<h4
			className={css`
        margin: 0;
        margin-top: 10px;
        margin-bottom: 5px;
        &::before {
          background: url(/assets/diagonal.svg) repeat;
          background-size: 4px 20px; /* Image size slightly larger for overlap */
          background-position: -4px -8px; /* Offset to create overlap */
          content: "";
          display: block;
          width: 100%;
          height: 10px;
          margin-right: 5px;
          color: black;
        }
      `}
		>
			{children}
		</h4>
	)
}
