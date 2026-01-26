import { atom } from "atom.io"
import { useO } from "atom.io/react"

function discoverUrl() {
	return new URL(window.location.href)
}
const urlAtom = atom<string>({
	key: `url`,
	default: () => discoverUrl().toString(),
	effects: [
		({ setSelf }) => {
			window.addEventListener(`popstate`, () => {
				setSelf(discoverUrl().toString())
			})
		},
	],
})

function UrlDisplay() {
	const url = useO(urlAtom)
	return <div>{url}</div>
}
