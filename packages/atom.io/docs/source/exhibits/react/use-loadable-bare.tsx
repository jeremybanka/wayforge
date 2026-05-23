import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

const myApiDataAtom = atom<Loadable<{ name: string }>>({
	key: `myApiData`,
	default: async () => {
		const response = await fetch(`https://api.github.com/users/jeremybanka`)
		return response.json()
	},
})

export function UrlDisplay(): React.JSX.Element {
	const myApiData = useLoadable(myApiDataAtom)
	if (myApiData === `LOADING`) {
		return <p>Loading...</p>
	}
	return (
		<div>
			<h1>
				{myApiData.value.name}
				{myApiData.loading ? ` ⌛` : ``}
			</h1>
		</div>
	)
}
