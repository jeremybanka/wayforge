import { css } from "@emotion/react"
import type { FC } from "react"
import { Link } from "react-router-dom"

export const Header: FC = () => (
	<b
		css={css`
      font-size: 200px;
    `}
	>
		w
	</b>
)

export const Home: FC = () => {
	return (
		<article
			css={css`
        display: flex;
        flex-flow: column;
        align-items: center;
        justify-content: center;
      `}
		>
			<Header />
			<Link to="energy">energy</Link>
			<Link to="reaction">reaction</Link>
		</article>
	)
}
