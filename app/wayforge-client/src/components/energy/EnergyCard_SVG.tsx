import type { FC } from "react"
import { useId } from "react"

import { css } from "@emotion/react"
import type { LuumCssRule } from "luum"
import { luumToCss } from "luum"
import { useRecoilValue } from "recoil"

import type { Energy } from "../../services/energy"
import { findEnergyState } from "../../services/energy"
import { EnergyIcon } from "./EnergyIcon_SVG"

export const EnergyCard: FC<{
  energyId: string
  size: number
  cx?: number
  cy?: number
}> = ({ energyId, size, cx = size / 2, cy = size / 2 }) => {
  const energy = useRecoilValue(findEnergyState(energyId))
  const domId = useId()
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`background-color`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`fill`, []],
  }

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)

  return (
    <svg
      // viewBox={`0 0 ${252} ${360}`}
      css={css`
        width: ${252}px;
        height: ${360}px;
        paint-order: stroke fill;
        display: inline;
        ${scssA};
      `}
    >
      <rect x={0} y={0} width={252} height={180} rx={20} ry={20} />
      <EnergyIcon energyId={energyId} size={50} cx={54} cy={306} />
    </svg>
  )
}
