import { StrictMode } from "react"

import { RecoilInspector } from "@eyecuelab/recoil-devtools"
import { createRoot } from "react-dom/client"
import { RecoilRoot } from "recoil"
import { LocationOption, RecoilURLSyncJSON, StoreKey } from "recoil-sync"

import { App } from "./App"

import "./index.scss"
import "./font-face.scss"

// type Options = {
//   storeKey?: string
//   location:
//     | { part: `hash` }
//     | { part: `href` }
//     | { part: `queryParams`; param?: string }
//     | { part: `search` }
//   browserInterface?: {
//     replaceURL?: (url: string) => void
//     pushURL?: (url: string) => void
//     getURL?: () => string
//     listenChangeURL?: (handler: () => void) => () => void
//   }
//   serialize: (data: unknown) => string
//   deserialize: (str: string) => unknown
// }

// const URL_SYNC_OPTIONS: Omit<Options, `deserialize` | `serialize`> = {
//   storeKey: `view`,
//   location: { part: `hash` },
//   // browserInterface: {
//   //   replaceURL: (url) => (window.location.hash = url),
//   //   pushURL: (url) => (window.location.hash = url),
//   //   getURL: () => window.location.hash,
//   //   listenChangeURL: (handler) => {
//   //     window.addEventListener(`hashchange`, handler)
//   //     return () => window.removeEventListener(`hashchange`, handler)
//   //   },
//   // },
// }
// // export interface RecoilURLSyncOptions {
// //   children: React.ReactNode;
// //   storeKey?: StoreKey;
// //   location: LocationOption;
// //   serialize: (data: unknown) => string;
// //   deserialize: (str: string) => unknown;
// //   browserInterface?: BrowserInterface;
// // }

const container = document.getElementById(`root`)
const root = createRoot(container as Element)
root.render(
  <StrictMode>
    <RecoilRoot>
      {/* <RecoilURLSyncJSON location={{ part: `queryParams` }}> */}
      <App />
      {/* </RecoilURLSyncJSON> */}
      <RecoilInspector />
    </RecoilRoot>
  </StrictMode>
)
