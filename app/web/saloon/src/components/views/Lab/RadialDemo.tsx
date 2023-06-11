import * as React from "react"

import { css } from "@emotion/react"
import * as AtomIO from "atom.io"
import type { Point2d } from "corners"
import { set } from "zod"

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

//

export const composeUseRadial =
  (
    setActions: (newActions: RadialAction[]) => void,
    getRadialMode: () => RadialMode,
    setRadialMode: (newMode: RadialMode) => void
  ) =>
  (
    actions: RadialAction[]
  ): Record<string, React.EventHandler<React.MouseEvent>> => {
    const mouseHasMoved = React.useRef(false)
    const handlers = {
      onMouseEnter: () => {
        if (getRadialMode() === `idle`) {
          setActions(actions)
        }
      },
      onMouseLeave: () => {
        if (getRadialMode() === `idle`) {
          setActions([])
        }
      },
      onMouseMove: () => (mouseHasMoved.current = true),
      ...makeMouseHandlers({
        onMouseDownR: () => (
          (mouseHasMoved.current = false), setRadialMode(`held`)
        ),
        onMouseUpR: () => {
          if (mouseHasMoved.current) {
            setRadialMode(`idle`)
          } else {
            setRadialMode(`open`)
          }
        },
      }),
    }
    return handlers
  }

//

export const useRadial = composeUseRadial(
  (v) => AtomIO.setState(actionsState, v),
  () => AtomIO.getState(radialModeState),
  (v) => AtomIO.setState(radialModeState, v)
)

//

export const RadialDemo: React.FC = () => {
  return (
    <>
      <span
        css={css`
          display: flex;
          flex-flow: row wrap;
        `}
      >
        {Array.from({ length: 12 }).map((_, idx) => {
          const handlers = useRadial(
            Array.from({ length: idx + 1 }).map((_, idx) => ({
              label: `Action ${idx + 1}`,
              do: () => console.log(`Action ${idx + 1}`),
            }))
          )

          return (
            <div
              key={idx}
              style={{
                width: 100,
                height: 100,
                background: new Luum({
                  hue: idx * 30,
                  sat: 190,
                  lum: 0.2,
                  prefer: `sat`,
                }).toHex(),
              }}
              {...handlers}
            />
          )
        })}
      </span>
      <Radial
        useMode={() => useIO(radialModeState)}
        useActions={() => useO(actionsState)}
        useMousePosition={() => useO(windowMousePositionState)}
      />
    </>
  )
}
