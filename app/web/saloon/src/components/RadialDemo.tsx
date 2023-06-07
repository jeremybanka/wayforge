import type { FC } from "react"

import { useO } from "~/packages/atom.io/src/react"
import { Radial } from "~/packages/hamr/src/react-radial/Layout"

import { windowMousePositionState } from "../services/mouse-position"

export const RadialDemo: FC = () => {
  const mousePosition = useO(windowMousePositionState)
  return (
    <Radial
      actions={[`a`, `b`, `c`, `d`, `e`, `f`, `g`, `h`, `i`, `j`]}
      passivePosition={mousePosition}
      usePosition={true}
    />
  )
}
