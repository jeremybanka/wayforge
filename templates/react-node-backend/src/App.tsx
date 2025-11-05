import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

const SERVER_URL = `http://localhost:3000`
const AUTHENTICATOR_URL = `http://localhost:4000`

const randomAtom = atom<Loadable<number>, Error>({
	key: `random`,
	default: async () => {
		const url = new URL(`/random`, SERVER_URL)
		const response = await fetch(url, { credentials: `include` })
		if (!response.ok) throw new Error(response.status.toString())
		const data = (await response.json()) as unknown
		if (typeof data === `number`) return data
		console.error(`Unexpected response from server`, data)
		return 0
	},
	catch: [Error],
})

function App(): React.JSX.Element {
	const { error, value, loading } = useLoadable(randomAtom, 0)

	return (
		<main>
			{error ? (
				<article className="takeover">
					<main className="card">
						<h1>Signed Out</h1>
						<button
							type="button"
							onClick={() => {
								window.location.href = `${AUTHENTICATOR_URL}/login`
							}}
						>
							Log in
						</button>
					</main>
				</article>
			) : null}
			<header>
				{error ? (
					<div className="pfp signed-out" />
				) : loading ? (
					<div className="pfp loading" />
				) : (
					<>
						<button
							type="button"
							onClick={() => {
								window.location.href = `${SERVER_URL}/logout`
							}}
						>
							Log out
						</button>
						<div className="pfp signed-in" />
					</>
				)}
			</header>
			{loading ? (
				<div className="data loading">{value}</div>
			) : (
				<div className="data">{value}</div>
			)}
		</main>
	)
}

export default App
