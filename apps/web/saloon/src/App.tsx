import { useIO, useO } from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import type { FC } from "react"
import { Link, Outlet, Route, Routes } from "react-router-dom"

import { Radial } from "~/packages/hamr/src/react-radial/Radial"

import scss from "./App.module.scss"
import { main } from "./components/containers/<main>"
import { Lab } from "./components/views/Lab"
import { RadialDemo } from "./components/views/Lab/RadialDemo"
import { Lobby } from "./components/views/Lobby"
import { RoomRoute } from "./components/views/Room/Room"
import { windowMousePositionState } from "./services/mouse-position"
import { actionsState, radialModeState } from "./services/radial"

export const App: FC = () => (
	<main className={scss.class}>
		<header>
			<nav>
				<Link to="/">{`<-`}</Link>
				<Link to="/lab">🧪</Link>
			</nav>
		</header>
		<main.auspicious>
			<Routes>
				<Route path="/" element={<Outlet />}>
					<Route index element={<Lobby />} />
					<Route path="room" element={<Outlet />}>
						<Route path=":roomId" element={<RoomRoute />} />
					</Route>
					<Route path="lab" element={<Lab />}>
						<Route path="radial-demo" element={<RadialDemo />} />
					</Route>
				</Route>
			</Routes>
			<Radial
				useMode={() => useIO(radialModeState)}
				useActions={() => useO(actionsState)}
				useMousePosition={() => useO(windowMousePositionState)}
			/>
			<AtomIODevtools />
		</main.auspicious>
	</main>
)
