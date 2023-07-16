import { css } from "@emotion/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import * as React from "react"
import { Link, Route, Routes, Outlet } from "react-router-dom"

import { useIO, useO } from "~/packages/atom.io/src/react"
import { Radial } from "~/packages/hamr/src/react-radial/Radial"

import { main } from "./components/containers/<main>"
import { Lab } from "./components/views/Lab"
import { RadialDemo } from "./components/views/Lab/RadialDemo"
import { Lobby } from "./components/views/Lobby"
import { RoomRoute } from "./components/views/Room/Room"
import { windowMousePositionState } from "./services/mouse-position"
import { actionsState, radialModeState } from "./services/radial"

export const App: React.FC = () => (
	<main
		css={css`
      height: 100vh;
      background: var(--bg-color);
      display: flex;
      flex-flow: column;
      position: relative;
      header {
        display: flex;
        padding: 10px;
        gap: 10px;
      }
    `}
	>
		<header>
			<nav>
				<Link to="/">{`<-`}</Link>
				<Link to="/lab">🧪</Link>
			</nav>
		</header>
		<main.auspicious
			css={css`
        flex-grow: 1;
      `}
		>
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
