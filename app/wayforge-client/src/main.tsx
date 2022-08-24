import { StrictMode } from "react"

import { createRoot } from "react-dom/client"
import { RecoilRoot } from "recoil"

import { RecoilInspector } from "~/lib/recoil/Inspector"

import { App } from "./App"
import { socket, SocketContext } from "./services/socket"

import "./index.css"
import "./font-face.css"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
  <StrictMode>
    <RecoilRoot>
      <SocketContext.Provider value={socket}>
        <App />
      </SocketContext.Provider>
      <RecoilInspector />
    </RecoilRoot>
  </StrictMode>
)
