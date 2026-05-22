# use loadable fallback

Source: src/exhibits/react/use-loadable-fallback.tsx

```tsx
import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

const myApiDataAtom = atom<Loadable<{ name: string }>, Error>({
	key: `myApiData`,
	default: async () => {
		const response = await fetch(`https://api.github.com/users/jeremybanka`)
		return response.json()
	},
	catch: [Error],
})

export function UrlDisplay(): React.JSX.Element {
	const myApiData = useLoadable(myApiDataAtom, { name: `Jeremy Banka` })
	return (
		<div>
			<h1>
				{myApiData.value.name}
				{myApiData.loading ? ` ⌛` : ``}
			</h1>
			{myApiData.error ? <p>{myApiData.error.message}</p> : null}
		</div>
	)
}
```
