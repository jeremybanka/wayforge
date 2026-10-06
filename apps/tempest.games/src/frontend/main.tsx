import "./globals.css"
import "atom.io/react-devtools/css"

import { AtomIODevtools } from "atom.io/react-devtools"
import { RealtimeProvider } from "atom.io/realtime-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { env } from "../library/env.ts"
import { AppShell } from "./AppShell.tsx"
import { socket } from "./services/socket-auth-service.ts"

createRoot(document.getElementById(`root`)!).render(
	<StrictMode>
		<RealtimeProvider socket={socket}>
			<AppShell />
			<AtomIODevtools hideByDefault={env.VITE_HIDE_DEVTOOLS} />
		</RealtimeProvider>
	</StrictMode>,
)
