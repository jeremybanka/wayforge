import type { FC } from "react"
import { useId } from "react"

import { css } from "@emotion/react"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/app/wayforge-client/recoil-list"
import { Luum } from "~/lib/Luum"

import type { Energy } from "../../services/energy"
import { findEnergyState } from "../../services/energy"
import type { Amount } from "../../services/energy_reaction"

export const SvgTSpan_Spacer: FC = () => (
  <tspan fill="none" stroke="none" style={{ userSelect: `none` }}>{`-`}</tspan>
)

export const EnergyIcon_INTERNAL: FC<{ energy: Energy; size: number }> = ({
  energy,
  size,
}) => {
  const domId = useId()
  const middle = size / 2
  const colorA = Luum.fromJSON(energy.colorA)
  const colorB = Luum.fromJSON(energy.colorB)

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

export const SVG_EnergyIcon: FC<{ energyId: string; size: number }> = ({
  energyId,
  size,
}) => {
  const energy = useRecoilValue(findEnergyState(energyId))
  return <EnergyIcon_INTERNAL energy={energy} size={size} />
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
      <SVG_EnergyIcon energyId={energyId} size={size} />
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

export const Span_EnergyAmount: FC<RecoilListItemProps<Energy, Amount>> = ({
  label,
  findState,
}) => {
  const { id, amount } = label
  const energy = useRecoilValue(findState(id))
  const domId = useId()
  return (
    <span
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 1px;
      `}
    >
      {amount <= 3 ? (
        Array(amount)
          .fill(null)
          .map((_, i) => (
            <SVG_EnergyIcon key={domId + `-icon-` + i} energyId={id} size={15} />
          ))
      ) : (
        <EnergyAmountTag energyId={energy.id} amount={amount} size={15} />
      )}
    </span>
  )
}
