# exact catch types

Source: src/exhibits/tooling/eslint-plugin/exact-catch-types.ts

```ts
import { atom } from "atom.io"

type Profile = {
	name: string
}

class RequestError extends Error {}

export const profileAtom = atom<Profile, RequestError>({
	key: `profile`,
	default: async () => {
		const response = await fetch(`/api/profile`)
		if (!response.ok) {
			throw new RequestError()
		}
		return response.json()
	},
	catch: [RequestError],
})
```
