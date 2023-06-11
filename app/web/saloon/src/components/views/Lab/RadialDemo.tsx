import * as React from "react"

import * as AtomIO from "atom.io"
import type { Point2d } from "corners"

import { useIO, useO } from "~/packages/atom.io/src/react"
import { makeMouseHandlers } from "~/packages/hamr/src/react-click-handlers"
import type { RadialAction } from "~/packages/hamr/src/react-radial/Layout"
import { Radial } from "~/packages/hamr/src/react-radial/Layout"
import { Luum } from "~/packages/Luum/src"

import { windowMousePositionState } from "../../../services/mouse-position"

const actionsState = AtomIO.atom<RadialAction[]>({
  key: `actions`,
  default: [],
})
const radialIsActiveState = AtomIO.atom<boolean>({
  key: `radialIsActive`,
  default: false,
})

export const RadialDemo: React.FC = () => {
  const mousePosition = useO(windowMousePositionState)
  const [actions, setActions] = useIO(actionsState)
  const [radialIsActive, setRadialIsActive] = useIO(radialIsActiveState)
  const activePosition = React.useRef<Point2d | null>(null)
  const mouseHasMoved = React.useRef(false)

  const handlersRed = makeMouseHandlers({
    onMouseDownR: () => (
      (mouseHasMoved.current = false),
      (activePosition.current = mousePosition),
      setRadialIsActive(true)
    ),
    onMouseUpR: () => {
      if (mouseHasMoved.current) {
        activePosition.current = null
        setRadialIsActive(false)
      }
    },
  })
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="red-box"
          style={{
            width: 100,
            height: 100,
            background: new Luum({
              hue: i * 30,
              sat: 255,
              lum: 0.5,
              prefer: `lum`,
            }).toHex(),
          }}
          onMouseEnter={() =>
            setActions(
              Array.from({ length: i }).map((_, i) => ({
                label: `action ${i}`,
                do: () => console.log(`action ${i}`),
              }))
            )
          }
          onMouseLeave={() => setActions([])}
          onMouseMove={() => (mouseHasMoved.current = true)}
          {...handlersRed}
          onClick={undefined}
        />
      ))}
      <Radial
        actions={actions}
        passivePosition={activePosition.current ?? mousePosition}
        usePosition={true}
        isActive={radialIsActive}
      />
    </>
  )
}
