import "./scss/index.scss"
import "./scss/font-face.scss"

import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./App.tsx"
import { socket } from "./services/socket-auth-service.ts"

// biome-ignore lint/style/noNonNullAssertion: I believe we will find the root
createRoot(document.getElementById(`root`)!).render(
	<StrictMode>
		<RealtimeProvider socket={socket}>
			<App />
		</RealtimeProvider>
	</StrictMode>,
)
