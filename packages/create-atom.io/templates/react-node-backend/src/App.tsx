import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

const SERVER_URL = `http://localhost:3000`
const AUTHENTICATOR_URL = `http://localhost:4000`

const randomAtom = atom<Loadable<number>, Error>({
	key: `random`,
	default: async () => {
		const url = new URL(`/random`, SERVER_URL)
		const response = await fetch(url, { credentials: `include` })
		const data = (await response.json()) as unknown
		if (typeof data === `number`) return data
		console.error(`Unexpected response from server`, data)
		return 0
	},
	catch: [Error],
})

function App(): React.JSX.Element {
	const { error, value, loading } = useLoadable(randomAtom, 0)

	console.log({ error, value, loading })

	return (
		<main>
			<header>
				{error ? (
					<div className="pfp signed-out" />
				) : (
					<>
						<button
							type="button"
							onClick={() => {
								window.location.href = `${AUTHENTICATOR_URL}/logout`
							}}
						>
							Log out
						</button>
						<div className="pfp signed-in" />
					</>
				)}
			</header>
			{error ? (
				<button
					type="button"
					onClick={() => {
						window.location.href = `${AUTHENTICATOR_URL}/login`
					}}
				>
					Log in
				</button>
			) : (
				<div className="data">
					<span>{value}</span>
					<span className="loader">{loading && `⏳`}</span>
				</div>
			)}
		</main>
	)
}

export default App
