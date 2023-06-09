import * as React from "react"

import * as AtomIO from "atom.io"
import type { Point2d } from "corners"

import { useIO, useO } from "~/packages/atom.io/src/react"
import { makeMouseHandlers } from "~/packages/hamr/src/react-click-handlers"
import type { RadialAction } from "~/packages/hamr/src/react-radial/Layout"
import { Radial } from "~/packages/hamr/src/react-radial/Layout"

import { windowMousePositionState } from "../services/mouse-position"

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
      <div
        className="red-box"
        style={{
          width: 100,
          height: 100,
          background: `red`,
        }}
        onMouseEnter={() =>
          setActions([
            { label: `a`, do: () => null },
            { label: `b`, do: () => null },
          ])
        }
        onMouseLeave={() => setActions([])}
        onMouseMove={() => (mouseHasMoved.current = true)}
        {...handlersRed}
        onClick={undefined}
      ></div>
      <div
        className="blue-box"
        style={{
          width: 100,
          height: 100,
          background: `blue`,
        }}
        onMouseEnter={() =>
          setActions([
            { label: `a`, do: () => null },
            { label: `b`, do: () => null },
            { label: `c`, do: () => null },
          ])
        }
        onMouseLeave={() => setActions([])}
      ></div>
      <Radial
        actions={actions}
        passivePosition={activePosition.current ?? mousePosition}
        usePosition={true}
        isActive={radialIsActive}
      />
    </>
  )
}
