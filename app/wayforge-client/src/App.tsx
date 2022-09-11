import type { FC } from "react"

import { css } from "@emotion/react"
import { atom } from "recoil"

import { ErrorBoundary, OOPS } from "~/lib/react-ui/error-boundary"

import { EnergyList } from "./components/energy/EnergyList"

export type View = {
  path: string
  query?: Record<string, string>
}

export const viewState = atom<View>({
  key: `view`,
  default: {
    path: `/`,
  },
})
export const App: FC = () => {
  return (
    <div className="App">
      <i
        css={css`
          font-size: 200px;
        `}
      >
        w
      </i>
      <ErrorBoundary>
        <EnergyList />
      </ErrorBoundary>

      {/* <ErrorBoundary>
        <OOPS />
      </ErrorBoundary> */}
    </div>
  )
}
