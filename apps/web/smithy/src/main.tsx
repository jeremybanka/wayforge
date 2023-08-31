import { RecoilInspector } from "@eyecuelab/recoil-devtools"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RecoilRoot } from "recoil"

import { App } from "./App"

import "./font-face.scss"
import "./index.scss"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
	<StrictMode>
		<RecoilRoot>
			<App />
			<RecoilInspector />
		</RecoilRoot>
	</StrictMode>,
)
