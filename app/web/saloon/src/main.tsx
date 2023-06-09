import { StrictMode } from "react"

import { AtomIODevtools } from "atom.io/react-devtools"
import { createRoot } from "react-dom/client"
import { Route } from "wouter"

import { SocketStatus } from "./components/SocketStatus"
import { Lobby } from "./components/views/Lobby"
import { Room } from "./components/views/Room/Room"

import "./scss/index.scss"
import "./scss/font-face.scss"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
  <StrictMode>
    <SocketStatus />
    <header>
      <h1>Saloon</h1>
    </header>
    <main>
      <Route path="/">
        <Lobby />
      </Route>
      <Route path="/room/:roomId">
        {(params) => <Room roomId={params.roomId} />}
      </Route>
      <AtomIODevtools />
    </main>
  </StrictMode>
)
