import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter as Router } from "react-router-dom"
import { io } from "socket.io-client"

import { App } from "./App"
import { env } from "./services/env"

import "./scss/font-face.scss"
import "./scss/index.scss"

const socket = io(env.VITE_REMOTE_ORIGIN)

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
	<StrictMode>
		<RealtimeProvider socket={socket}>
			<Router>
				<App />
			</Router>
		</RealtimeProvider>
	</StrictMode>,
)
