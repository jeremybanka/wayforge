import "./index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App.tsx"

// biome-ignore lint/style/noNonNullAssertion: I believe we will find the root
createRoot(document.getElementById(`root`)!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
