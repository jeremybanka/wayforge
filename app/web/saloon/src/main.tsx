import { StrictMode } from "react"

import { RecoilInspector } from "@eyecuelab/recoil-devtools"
import { createRoot } from "react-dom/client"
import { RecoilRoot } from "recoil"

import { App } from "./App"

import "./index.scss"
import "./font-face.scss"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
