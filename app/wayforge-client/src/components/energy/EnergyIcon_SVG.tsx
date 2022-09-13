import type { FC } from "react"

import { css } from "@emotion/react"
import type { LuumCssRule } from "luum"
import { luumToCss } from "luum"

import type { Energy } from "../../services/energy"

export const EnergyIcon: FC<{
  energy: Energy
  size: number
  cx?: number
  cy?: number
}> = ({ energy, size, cx = size / 2, cy = size / 2 }) => {
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`fill`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`fill`, []],
  }

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      css={css`
        width: ${size}px;
        height: ${size}px;
      `}
    >
      <circle
        cx={cx}
        cy={cy}
        r={size / 2}
        fill="white"
        css={css`
          ${scssB};
        `}
      />
      <text
        x={cx - size * 0.39}
        y={cy + size * 0.2}
        css={css`
          font-family: "|_'_|";
          font-size: ${size * 0.67}px;
          ${scssA};
        `}
      >
        {energy.icon}
      </text>
    </svg>
  )
}
