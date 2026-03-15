import { StoreProvider } from "atom.io/solid"
import { render } from "solid-js/web"

import { App } from "./App"
import "./index.css"

render(
	() => (
		<StoreProvider>
			<App />
		</StoreProvider>
	),
	document.getElementById(`app`)!,
)
