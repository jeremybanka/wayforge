import type { FC } from "react"
import { useId } from "react"

import { css } from "@emotion/react"
import { useRecoilValue } from "recoil"

import { luumToCss } from "~/lib/luum"
import type { LuumCssRule } from "~/lib/luum"

import { findEnergyState } from "../../services/energy"

export const EnergyIcon: FC<{
  energyId: string
  size: number
  cx?: number
  cy?: number
}> = ({ energyId, size, cx = size / 2, cy = size / 2 }) => {
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
      css={css`
        width: ${size}px;
        height: ${size}px;
        paint-order: stroke fill;
        display: inline;
      `}
    >
      <clipPath id={`${domId}-clip`}>
        <circle cx={cx} cy={cy} r={size} />
      </clipPath>
      <text
        id={domId + `-text`}
        textAnchor="middle"
        x={cx}
        y={cy + size * 0.25}
        clipPath={`url(#${domId}-clip)`}
        css={css`
          font-family: "Uruz";
          font-size: ${size}px;
          ${scssB};
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
        y={cy + size * 0.25}
        clipPath={`url(#${domId}-clip)`}
        css={css`
          font-family: "Uruz";
          font-size: ${size}px;
          ${scssA};
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
    </svg>
  )
}

export const EnergyAmountTag: FC<{
  energyId: string
  amount: number
  size: number
}> = ({ energyId, amount, size }) => {
  const small = size * 0.6
  return (
    <span
      css={css`
        display: inline-flex;
        align-items: bottom;
        justify-content: baseline;
      `}
    >
      <EnergyIcon energyId={energyId} size={size} />
      <span
        css={css`
          background-color: black;
          color: white;
          border: 0px solid white;
          padding: 1px;
          font-weight: 600;
          min-width: ${small}px;
          font-size: ${small}px;
          line-height: ${small * 0.8}px;
          height: ${small}px;
          text-align: center;
          align-items: center;
          justify-content: center;
          margin-left: ${small * -0.2}px;
        `}
      >
        {amount}
      </span>
    </span>
  )
}
