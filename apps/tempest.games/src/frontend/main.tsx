import "./index.css"

import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { io } from "socket.io-client"

import App from "./App.tsx"

export const socket = io(
	import.meta.env.MODE === `development`
		? `http://localhost:4444/`
		: `https://realtime.tempest.games/`,
	{
		auth: { token: `test`, username: Math.random().toString() },
	},
)

// biome-ignore lint/style/noNonNullAssertion: I believe we will find the root
createRoot(document.getElementById(`root`)!).render(
	<StrictMode>
		<RealtimeProvider socket={socket}>
			<App />
		</RealtimeProvider>
	</StrictMode>,
)
