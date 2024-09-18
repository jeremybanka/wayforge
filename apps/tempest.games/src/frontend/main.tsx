import "./index.css"

import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { io } from "socket.io-client"

import App from "./App.tsx"

let localId: string
try {
	const rawId = localStorage.getItem(`myId`)
	if (rawId) {
		localId = JSON.parse(rawId)
	} else {
		localId = Math.random().toString()
		localStorage.setItem(`myId`, JSON.stringify(localId))
	}
} catch (_) {
	localId = Math.random().toString()
	localStorage.setItem(`myId`, JSON.stringify(localId))
}

export const socket = io(
	import.meta.env.MODE === `development`
		? `http://localhost:4444/`
		: `https://realtime.tempest.games/`,
	{
		auth: { token: `test`, username: localId },
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
