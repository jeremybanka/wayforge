import type { FC } from "react"
import { useId } from "react"

import { css } from "@emotion/react"
import type { LuumCssRule } from "luum"
import { specToHex, luumToCss } from "luum"
import { useRecoilValue } from "recoil"

import type { Energy } from "../../services/energy"
import { findEnergyState } from "../../services/energy"

export const EnergyIcon: FC<{
  energyId: string
  amount?: number
  size: number
  cx?: number
  cy?: number
}> = ({ energyId, amount, size, cx = size / 2, cy = size / 2 }) => {
  const energy = useRecoilValue(findEnergyState(energyId))
  const domId = useId()
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
      // viewBox={`0 0 ${size} ${size}`}
      css={css`
        width: ${size}px;
        height: ${size}px;
        paint-order: stroke fill;
        display: inline;
      `}
    >
      <clipPath id={`${domId}-clip`}>
        <circle cx={cx} cy={cy} r={size * 0.5} />
      </clipPath>
      <text
        id={domId + `-text`}
        textAnchor="middle"
        x={cx}
        y={cy + size * 0.2}
        clipPath={`url(#${domId}-clip)`}
        css={css`
          font-family: "Uruz";
          font-size: ${size * 0.67}px;
          ${scssB};
          /* stroke-width: ${size * 0.12}; */
        `}
      >
        <tspan
          fill="none"
          stroke="none"
          style={{ userSelect: `none` }}
        >{`-`}</tspan>
        {` MT `}
        <tspan
          fill="none"
          stroke="none"
          style={{ userSelect: `none` }}
        >{`-`}</tspan>
      </text>
      <text
        id={domId + `-text`}
        textAnchor="middle"
        x={cx}
        y={cy + size * 0.2}
        clipPath={`url(#${domId}-clip)`}
        css={css`
          font-family: "Uruz";
          font-size: ${size * 0.67}px;
          ${scssA};
          /* stroke-width: ${size * 0.12}px; */
        `}
      >
        <tspan
          fill="none"
          stroke="none"
          style={{ userSelect: `none` }}
        >{`-`}</tspan>
        {` ${energy.icon} `}
        <tspan
          fill="none"
          stroke="none"
          style={{ userSelect: `none` }}
        >{`-`}</tspan>
      </text>

      {/* <use clipPath={`url(#${domId}-clip)`} href={domId + `-text`} /> */}
    </svg>
  )
}

export const EnergyAmountTag: FC<{
  energyId: string
  amount: number
  size: number
}> = ({ energyId, amount, size }) => {
  const energy = useRecoilValue(findEnergyState(energyId))
  const colorA = specToHex(energy.colorA)
  const colorB = specToHex(energy.colorB)
  return (
    <span
      css={css`
        display: inline-flex;
        align-items: center;
      `}
    >
      <span
        css={css`
          background-color: ${colorB};
          color: ${colorA};
          padding-left: 4px;
          padding-right: 10px;
          padding-bottom: 2px;
          display: flex;
          font-weight: 600;
          font-size: ${size}px;
          line-height: ${size * 0.8}px;
          align-items: center;
          justify-content: center;
          margin-right: ${size * -0.8}px;
        `}
      >
        {amount}
      </span>
      <EnergyIcon energyId={energyId} size={size * 1.7} />
    </span>
  )
}
