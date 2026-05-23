# basic setup

Source: docs/source/exhibits/tooling/react-devtools/basic-setup.tsx.txt

```tsx
import { AtomIODevtools } from "atom.io/react-devtools"
import "atom.io/react-devtools/css"

export function App() {
	return (
		<>
			<main>{/* your app */}</main>
			<AtomIODevtools />
		</>
	)
}
```
