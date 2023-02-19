import type { FC } from "react"
import { useId } from "react"

import { css } from "@emotion/react"
import { useNavigate } from "react-router-dom"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/packages/hamr/recoil-tools/recoil-list"
import { Luum } from "~/packages/Luum/src"

import type { Energy } from "../../services/energy"
import { findEnergyState } from "../../services/energy"
import type { Amount } from "../../services/energy_reaction"

export const SvgTSpan_Spacer: FC = () => (
  <tspan fill="none" stroke="none" style={{ userSelect: `none` }}>{`-`}</tspan>
)

export const EnergyIcon_INTERNAL: FC<{
  energy: Energy
  size: number
  clickable?: boolean
}> = ({ energy, size, clickable = true }) => {
  const domId = useId()
  const middle = size / 2
  const colorA = Luum.fromJSON(energy.colorA)
  const colorB = Luum.fromJSON(energy.colorB)
  const navigate = useNavigate()

  return (
    <svg
      css={css`
        width: ${size}px;
        height: ${size}px;
        paint-order: stroke fill;
        display: inline;
        cursor: pointer;
      `}
      onClick={clickable ? () => navigate(`/energy/${energy.id}`) : undefined}
    >
      <clipPath id={`${domId}-clip`}>
        <circle cx={middle} cy={middle} r={size} />
      </clipPath>
      <text
        textAnchor="middle"
        x={middle}
        y={middle + size * 0.25}
        clipPath={`url(#${domId}-clip)`}
        css={css`
          font-family: "Uruz";
          font-size: ${size}px;
          fill: ${colorB.hex};
        `}
      >
        <SvgTSpan_Spacer />
        {` MT `}
        <SvgTSpan_Spacer />
      </text>
      <text
        textAnchor="middle"
        x={middle}
        y={middle + size * 0.25}
        clipPath={`url(#${domId}-clip)`}
        css={css`
          font-family: "Uruz";
          font-size: ${size}px;
          fill: ${colorA.hex};
        `}
      >
        <SvgTSpan_Spacer />
        {` ${energy.icon} `}
        <SvgTSpan_Spacer />
      </text>
    </svg>
  )
}

export const SVG_EnergyIcon: FC<{
  energyId: string
  size: number
  clickable?: boolean
}> = ({ energyId, size, clickable = true }) => {
  const energy = useRecoilValue(findEnergyState(energyId))
  return (
    <EnergyIcon_INTERNAL energy={energy} size={size} clickable={clickable} />
  )
}

export const VOID: Energy = {
  id: `VOID`,
  icon: ``,
  name: `Void`,
  colorA: {
    hue: 0,
    sat: 0,
    lum: 0.8,
    prefer: `lum`,
  },
  colorB: {
    hue: 0,
    sat: 0,
    lum: 0,
    prefer: `lum`,
  },
}

export const SVG_VoidIcon: FC<{
  size: number
  colorA: Luum
  colorB: Luum
}> = ({ size, colorA, colorB }) => (
  <EnergyIcon_INTERNAL energy={{ ...VOID, colorA, colorB }} size={size} />
)

export const Span_VoidIcon: FC<{
  size: number
  colorA: Luum
  colorB: Luum
}> = ({ size, colorA, colorB }) => (
  <span
    css={css`
      display: inline-flex;
      align-items: center;
    `}
  >
    <SVG_VoidIcon size={size} colorA={colorA} colorB={colorB} />
  </span>
)

export const EnergyAmountTag: FC<{
  energyId: string
  amount: number
  size: number
  clickable?: boolean
}> = ({ energyId, amount, size, clickable = true }) => {
  const small = size * 0.6
  return (
    <span
      css={css`
        display: inline-flex;
        align-items: bottom;
        justify-content: baseline;
      `}
    >
      <SVG_EnergyIcon energyId={energyId} size={size} clickable={clickable} />
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

export const Span_EnergyAmount: FC<
  RecoilListItemProps<Energy, Amount> & { size: number; clickable?: boolean }
> = ({ label, findState, size, clickable = true }) => {
  const { id, amount } = label
  const energy = useRecoilValue(findState(id))
  const domId = useId()
  return (
    <span
      css={css`
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        gap: 1px;
      `}
    >
      {amount <= 3 ? (
        Array(amount)
          .fill(null)
          .map((_, i) => (
            <SVG_EnergyIcon
              key={domId + `-icon-` + i}
              energyId={id}
              size={size}
              clickable={clickable}
            />
          ))
      ) : (
        <EnergyAmountTag
          energyId={energy.id}
          amount={amount}
          size={size}
          clickable={clickable}
        />
      )}
    </span>
  )
}
