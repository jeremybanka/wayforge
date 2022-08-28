import { StrictMode } from "react"

import { createRoot } from "react-dom/client"
import { RecoilRoot } from "recoil"

import { RecoilInspector } from "~/lib/recoil-tools/Inspector"

import { App } from "./App"
import { socket, SocketContext } from "./services/socket"

import "./index.scss"
import "./font-face.scss"

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
