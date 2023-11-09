import { atom } from "atom.io"
import { useO } from "atom.io/react"

function discoverUrl() {
	return new URL(window.location.href)
}
const urlState = atom<string>({
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

export const UrlDisplay: React.FC = () => {
	const url = useO(urlState)
	return <div>{url}</div>
}
