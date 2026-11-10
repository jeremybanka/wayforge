import "./globals.css"
import "@atom.io/spa-devtools/css"

import { render } from "@atom.io/spa"
import { floatingCapability } from "@atom.io/spa/floating"
import { motionCapability } from "@atom.io/spa/motion"
import { AtomIODevtools } from "@atom.io/spa-devtools"

import { env } from "../library/env.ts"
import { AppShell } from "./AppShell.tsx"
import { useRealtimeConnection } from "./services/realtime-hooks.ts"

render(
	() => {
		useRealtimeConnection()
		return (
			<>
				<AppShell />
				<AtomIODevtools hideByDefault={env.VITE_HIDE_DEVTOOLS} />
			</>
		)
	},
	document.getElementById(`root`)!,
	{
		capabilities: [
			motionCapability({
				layoutTransition: { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
			}),
			floatingCapability(),
		],
	},
)
