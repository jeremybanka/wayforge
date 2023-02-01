import { StrictMode } from "react"

import { RecoilInspector } from "@eyecuelab/recoil-devtools"
import { createRoot } from "react-dom/client"
import { RecoilRoot } from "recoil"
import { RecoilDevtools } from "recoil-devtools"
import { RecoilLogger } from "recoil-devtools-logger"

import { recordToEntries } from "~/packages/anvl/src/object"

import { App } from "./App"
import { git } from "./services/git"

import "./index.scss"
import "./font-face.scss"

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
  <StrictMode>
    <RecoilRoot>
      <App />
      {/* <RecoilInspector /> */}
    </RecoilRoot>
  </StrictMode>
)
