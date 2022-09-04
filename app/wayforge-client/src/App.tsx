import type { FC } from "react"

import { css } from "@emotion/react"

import { ErrorBoundary, OOPS } from "~/lib/gui/error-boundary"

import { EnergyList } from "./components/energy/EnergyList"

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
