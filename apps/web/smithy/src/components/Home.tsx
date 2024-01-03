import type { FC } from "react"
import { Link } from "react-router-dom"

export const Header: FC = () => <b style={{ fontSize: 200 }}>w</b>

export const Home: FC = () => {
	return (
		<article
			style={{
				display: `flex`,
				flexFlow: `column`,
				alignItems: `center`,
				justifyContent: `center`,
			}}
		>
			<Header />
			<Link to="energy">energy</Link>
			<Link to="reaction">reaction</Link>
		</article>
	)
}
