import { StrictMode } from "react"

import { createRoot } from "react-dom/client"

import { App } from "./App"
import "./index.css"
import "./font-face.css"
import { socket, SocketContext } from "./services/socket"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
  <StrictMode>
    <SocketContext.Provider value={socket}>
      <App />
    </SocketContext.Provider>
  </StrictMode>
)
