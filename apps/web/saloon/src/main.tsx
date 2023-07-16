import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter as Router } from "react-router-dom"
import { io } from "socket.io-client"

import { App } from "./App"
import { SocketStatus } from "./components/SocketStatus"
import { env } from "./services/env"

import "./scss/index.scss"
import "./scss/font-face.scss"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
	<StrictMode>
		<RealtimeProvider socket={io(env.VITE_REMOTE_ORIGIN)}>
			<SocketStatus />
			<Router>
				<App />
			</Router>
		</RealtimeProvider>
	</StrictMode>,
)
