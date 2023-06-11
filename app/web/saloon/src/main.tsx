import { StrictMode } from "react"

import { createRoot } from "react-dom/client"
import { BrowserRouter as Router } from "react-router-dom"

import { App } from "./App"
import { SocketStatus } from "./components/SocketStatus"

import "./scss/index.scss"
import "./scss/font-face.scss"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
  <StrictMode>
    <SocketStatus />
    <Router>
      <App />
    </Router>
  </StrictMode>
)
