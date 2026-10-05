import "./globals.css"
import "atom.io/react-devtools/css"

import { AtomIODevtools } from "atom.io/react-devtools"
import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { env } from "../library/env.ts"
import { socket } from "./services/socket-auth-service.ts"
import { TempestApp } from "./TempestApp.tsx"

createRoot(document.getElementById(`root`)!).render(
	<StrictMode>
		<RealtimeProvider socket={socket}>
			<TempestApp />
			<AtomIODevtools hideByDefault={env.VITE_HIDE_DEVTOOLS} />
		</RealtimeProvider>
	</StrictMode>,
)
