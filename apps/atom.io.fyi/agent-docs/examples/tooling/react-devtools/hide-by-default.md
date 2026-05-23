# hide by default

Source: docs/source/exhibits/tooling/react-devtools/hide-by-default.tsx.txt

```tsx
import { AtomIODevtools } from "atom.io/react-devtools"
import "atom.io/react-devtools/css"

export function App() {
	return (
		<>
			<main>{/* your app */}</main>
			<AtomIODevtools hideByDefault={true} />
		</>
	)
}
```
