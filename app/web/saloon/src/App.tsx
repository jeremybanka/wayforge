import * as React from "react"

import { css } from "@emotion/react"
import { AtomIODevtools } from "atom.io/react-devtools"
import { Link, Route, Routes, Outlet } from "react-router-dom"

import { main } from "./components/containers/<main>"
import { Lab } from "./components/views/Lab"
import { RadialDemo } from "./components/views/Lab/RadialDemo"
import { Lobby } from "./components/views/Lobby"
import { RoomRoute } from "./components/views/Room/Room"

export const App: React.FC = () => (
  <main
    css={css`
      height: 100vh;
      background: var(--bg-color);
      display: flex;
      flex-flow: column;
      position: relative;
      header {
        padding: 10px;
        font-family: Uruz;
        h1 {
          margin: 0;
        }
      }
    `}
  >
    <header>
      <h1>Saloon</h1>
      <nav>
        <Link to="/">Lobby</Link>
        <Link to="/lab">Lab</Link>
      </nav>
    </header>
    <main.auspicious
      css={css`
        flex-grow: 1;
        padding: 10px;
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
      <AtomIODevtools />
    </main.auspicious>
    <footer
      css={css`
        padding: 10px;
      `}
    >
      <p>
        <a href="">About</a>
      </p>
    </footer>
  </main>
)
