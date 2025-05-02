import "./font-face.scss"
import "./index.scss"

import { RecoilInspector } from "@eyecuelab/recoil-devtools"
import { StoreProvider } from "atom.io/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
	<StrictMode>
		<StoreProvider>
			<App />
			<RecoilInspector />
		</StoreProvider>
	</StrictMode>,
)
