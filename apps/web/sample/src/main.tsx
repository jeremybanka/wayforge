import "./scss/font-face.scss"
import "./scss/index.scss"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
	<StrictMode>
		<App />
	</StrictMode>,
)
