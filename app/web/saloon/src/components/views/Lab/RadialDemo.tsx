import * as React from "react"

import { css } from "@emotion/react"
import * as AtomIO from "atom.io"
import type { Point2d } from "corners"

import { useIO, useO } from "~/packages/atom.io/src/react"
import { makeMouseHandlers } from "~/packages/hamr/src/react-click-handlers"
import type {
  RadialAction,
  RadialMode,
} from "~/packages/hamr/src/react-radial/Layout"
import { Radial } from "~/packages/hamr/src/react-radial/Layout"
import { Luum } from "~/packages/Luum/src"

import { windowMousePositionState } from "../../../services/mouse-position"

const actionsState = AtomIO.atom<RadialAction[]>({
  key: `actions`,
  default: [],
})
const radialModeState = AtomIO.atom<RadialMode>({
  key: `radialMode`,
  default: `idle`,
})

export const RadialDemo: React.FC = () => {
  const mousePosition = useO(windowMousePositionState)
  const [actions, setActions] = useIO(actionsState)
  const [radialMode, setRadialMode] = useIO(radialModeState)
  const mouseHasMoved = React.useRef(false)

  const handlers = makeMouseHandlers({
    onMouseDownR: () => ((mouseHasMoved.current = false), setRadialMode(`held`)),
    onMouseUpR: () => {
      if (mouseHasMoved.current) {
        setRadialMode(`idle`)
      } else {
        setRadialMode(`open`)
      }
    },
  })
  return (
    <>
      <span
        css={css`
          display: flex;
          flex-flow: row wrap;
        `}
      >
        {Array.from({ length: 12 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              width: 100,
              height: 100,
              background: new Luum({
                hue: idx * 30,
                sat: 255,
                lum: 0.5,
                prefer: `lum`,
              }).toHex(),
            }}
            onMouseEnter={() =>
              setActions(
                Array.from({ length: idx }).map((_, i) => ({
                  label: `action ${i + 1}`,
                  do: () => console.log(`action ${i + 1}`),
                }))
              )
            }
            onMouseLeave={() => {
              if (radialMode === `idle`) {
                setActions([])
              }
            }}
            onMouseMove={() => (mouseHasMoved.current = true)}
            {...handlers}
            onClick={undefined}
          />
        ))}
      </span>
      <Radial
        actions={actions}
        position={mousePosition}
        mode={radialMode}
        setMode={setRadialMode}
      />
    </>
  )
}
