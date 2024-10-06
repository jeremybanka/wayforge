import "./index.css"

import { atom, getState, setState } from "atom.io"
import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { io } from "socket.io-client"

import { env } from "../library/env.ts"
import App from "./App.tsx"

export const socket = io(env.VITE_BACKEND_ORIGIN, {
	auth: () => getState(authAtom) ?? {},
	autoConnect: false,
}).on(`connect_error`, () => {
	setState(authAtom, null)
})

export const authAtom = atom<{ username: string; sessionKey: string } | null>({
	key: `auth`,
	default: null,
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				console.log(`authAtom`, newValue)
				if (newValue) {
					localStorage.setItem(`username`, newValue.username)
					localStorage.setItem(`sessionKey`, newValue.sessionKey)
					socket.connect()
				} else {
					localStorage.removeItem(`sessionKey`)
				}
			})
		},
		({ setSelf }) => {
			const username = localStorage.getItem(`username`)
			const sessionKey = localStorage.getItem(`sessionKey`)
			if (username && sessionKey) {
				setSelf({ username, sessionKey })
			}
		},
	],
})

// biome-ignore lint/style/noNonNullAssertion: I believe we will find the root
createRoot(document.getElementById(`root`)!).render(
	<StrictMode>
		<RealtimeProvider socket={socket}>
			<App />
		</RealtimeProvider>
	</StrictMode>,
)
