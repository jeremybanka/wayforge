import type { FC } from "react"
import { useId } from "react"

import { css } from "@emotion/react"
import type { LuumCssRule } from "luum"
import { specToHex, luumToCss } from "luum"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/app/wayforge-client/recoil-list"
import { RecoilList } from "~/app/wayforge-client/recoil-list"

import type { Energy } from "../../services/energy"
import {
  findEnergyWithRelationsState,
  findEnergyState,
} from "../../services/energy"
import type { Amount } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import {
  findReactionWithRelationsState,
  findReactionState,
} from "../../services/reaction"
import { EnergyAmountTag, EnergyIcon } from "./EnergyIcon_SVG"

const A: FC<{
  energyId: string
  size: number
  cx?: number
  cy?: number
}> = ({ energyId, size, cx = size / 2, cy = size / 2 }) => {
  const energy = useRecoilValue(findEnergyState(energyId))
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`background-color`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`fill`, []],
  }

  const colorA = specToHex(colorSchemeA.root)
  const colorB = specToHex(colorSchemeB.root)

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)

  return (
    <svg
      css={css`
        width: ${252}px;
        height: ${360}px;
        paint-order: stroke fill;
        display: inline;
        ${scssA};
        font-family: "Uruz";
      `}
    >
      <>
        <rect x={0} y={300} width={252} height={2} />
        <text
          x={60}
          y={342}
          fill={colorB}
          fontSize={33}
          style={{ fontWeight: 600 }}
        >
          {energy.name}
        </text>
      </>

      <EnergyIcon energyId={energyId} size={50} cx={36} cy={330} />
    </svg>
  )
}

export const EnergyCardReagent: FC<RecoilListItemProps<Energy, Amount>> = ({
  label,
  findState,
}) => {
  const { id, amount } = label
  const energy = useRecoilValue(findState(label.id))
  const domId = useId()
  return <EnergyAmountTag energyId={energy.id} amount={amount} size={20} />
}

export const EnergyCardFeature: FC<
  RecoilListItemProps<Reaction & ReactionRelations>
> = ({ label, findState }) => {
  const reaction = useRecoilValue(findState(label.id))

  return (
    <div
      css={css`
        border: 1px solid black;
      `}
    >
      <span>
        {reaction.time}
        {reaction.timeUnit}:{` `}
      </span>
      <RecoilList
        findState={findEnergyState}
        labels={reaction.reagents}
        Components={{
          ListItem: EnergyCardReagent,
        }}
      />
      {`->`}
      {reaction.products.length > 0 ? (
        <RecoilList
          findState={findEnergyState}
          labels={reaction.products}
          Components={{
            ListItem: EnergyCardReagent,
          }}
        />
      ) : (
        `void`
      )}
    </div>
  )
}

const B: FC<{
  energyId: string
  size: number
  cx?: number
  cy?: number
}> = ({ energyId, size, cx = size / 2, cy = size / 2 }) => {
  const energy = useRecoilValue(findEnergyWithRelationsState(energyId))
  const domId = useId()
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`background-color`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`background-color`, []],
  }

  const colorA = specToHex(colorSchemeA.root)
  const colorB = specToHex(colorSchemeB.root)

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)

  return (
    <svg
      css={css`
        width: ${252}px;
        height: ${360}px;
        paint-order: stroke fill;
        display: inline;
        ${scssA};
        font-family: "Uruz";
      `}
    >
      <RecoilList
        labels={energy.features}
        findState={findReactionWithRelationsState}
        Components={{
          ListItem: EnergyCardFeature,
          // ListItemWrapper: ({ children }) => <li>{children}</li>,
          Wrapper: ({ children }) => (
            <foreignObject width={252} height={360}>
              <div
                css={css`
                  padding: 10px;
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                `}
              >
                {children}
              </div>
            </foreignObject>
          ),
        }}
      />
    </svg>
  )
}

export const EnergyCard = {
  A,
  B,
}
