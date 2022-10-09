import { useId } from "react"
import type { FC } from "react"

import { css } from "@emotion/react"
import styled from "@emotion/styled"
import corners, { chamfer } from "corners"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/app/wayforge-client/recoil-list"
import { RecoilList } from "~/app/wayforge-client/recoil-list"
import { Luum } from "~/lib/Luum"

import type { Energy } from "../../services/energy"
import {
  findEnergyWithRelationsState,
  findEnergyState,
} from "../../services/energy"
import type { Amount } from "../../services/energy_reaction"
import { findReactionEnergyState } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import { findReactionWithRelationsState } from "../../services/reaction"
import { EnergyAmountTag, EnergyIcon } from "./EnergyIcon_SVG"

export const rightSlant = corners(null, chamfer)

export const EnergyCard_A: FC<{ energyId: string }> = ({ energyId }) => {
  const domId = useId()
  const energy = useRecoilValue(findEnergyState(energyId))

  const colorA = Luum.fromJSON(energy.colorA)
  const colorB = Luum.fromJSON(energy.colorB)

  return (
    <div
      css={css`
        width: ${252}px;
        height: ${360}px;
        paint-order: stroke fill;
        display: flex;
        flex-flow: column;
        background: ${colorA.hex};
        font-family: "Uruz";
        position: relative;
        font-size: 10.8px;
        header {
          font-size: 1.5em;
          padding: 10px;
          position: absolute;
          top: 0;
          left: 0;
        }
        main {
          flex-grow: 1;
          display: flex;
          flex-flow: column;
          padding-top: 5px;
          padding-bottom: 40px;
          > * {
            display: flex;
            flex-flow: row;
            width: 100%;
            height: 10px;
            padding: 0 10px;
            flex-grow: 1;
            font-size: 7.2px;
            justify-content: flex-end;
            align-items: center;
            color: ${colorB.hex};
          }
          > * ~ * {
            border-top: 1px solid ${colorA.shade(5).hex};
          }
        }
      `}
    >
      <header>
        <EnergyIcon energyId={energyId} size={36} />
      </header>
      <main>
        {Array(30)
          .fill(0)
          .map((_, i) => (
            <div key={domId + `bar` + i + 1}>{i + 1}</div>
          ))}
      </main>
    </div>
  )
}

export const EnergyAmount: FC<RecoilListItemProps<Energy, Amount>> = ({
  label,
  findState,
}) => {
  const { id, amount } = label
  const energy = useRecoilValue(findState(id))
  const domId = useId()
  return amount <= 3 ? (
    <span
      css={css`
        display: inline-flex;
        align-items: center;
      `}
    >
      {Array(amount)
        .fill(null)
        .map((_, i) => (
          <EnergyIcon key={domId + `-icon-` + i} energyId={id} size={15} />
        ))}
    </span>
  ) : (
    <EnergyAmountTag energyId={energy.id} amount={amount} size={15} />
  )
}

const energyListCss = css`
  flex-grow: 1;
  width: 50%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 2px;
`

export const EnergyCardFeature: FC<
  RecoilListItemProps<Reaction & ReactionRelations>
> = ({ label, findState }) => {
  const reaction = useRecoilValue(findState(label.id))
  const energy = useRecoilValue(findReactionEnergyState(reaction.id))
  const colorB = Luum.fromJSON(energy.colorB)
  const energyIsPresentColor = colorB.tint(10)
  const energyIsAbsentColor = colorB.shade(10)
  const reactionProducesEnergy = reaction.products.some(
    (product) => product.id === energy.id
  )
  const reactionConsumesEnergy = reaction.reagents.some(
    (reagent) => reagent.id === energy.id
  )

  return (
    <div>
      <h2
        css={css`
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin: 0;
          font-size: 13.5px;
          small {
            font-size: 10.8px;
          }
        `}
      >
        {reaction.name}
        <small>
          {reaction.time}
          {reaction.timeUnit}
        </small>
      </h2>
      <div
        css={css`
          display: flex;
          gap: 2px;
        `}
      >
        {reaction.reagents.length > 0 ? (
          <RecoilList
            findState={findEnergyState}
            labels={reaction.reagents}
            Components={{
              Wrapper: styled(corners(null, null, chamfer, null).size(5).span)(
                css`
                  background-color: ${reactionConsumesEnergy
                    ? energyIsPresentColor.hex
                    : energyIsAbsentColor.hex};
                  ${energyListCss}
                `
              ),
              ListItem: EnergyAmount,
            }}
          />
        ) : (
          <EnergyIcon size={15} />
        )}
        {reaction.products.length > 0 ? (
          <RecoilList
            findState={findEnergyState}
            labels={reaction.products}
            Components={{
              Wrapper: styled(corners(chamfer, null, null, null).size(5).span)(
                css`
                  background: ${reactionProducesEnergy
                    ? energyIsPresentColor.hex
                    : energyIsAbsentColor.hex};
                  ${energyListCss}
                `
              ),
              ListItem: EnergyAmount,
            }}
          />
        ) : (
          <EnergyIcon size={15} />
        )}
      </div>
    </div>
  )
}

export const EnergyCard_B: FC<{ energyId: string }> = ({ energyId }) => {
  const energy = useRecoilValue(findEnergyWithRelationsState(energyId))
  const colorB = Luum.fromJSON(energy.colorB)

  return (
    <div
      css={css`
        background-color: ${colorB.hex};
        width: 252px;
        height: 360px;
        display: flex;
        flex-direction: column;
        font-family: "Uruz";
        font-size: 10.8px;
        color: white;
        header {
          font-size: 1.5em;
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 2px;
          h1 {
            margin: 0;
          }
        }
      `}
    >
      <header>
        <EnergyIcon energyId={energyId} size={36} />
        <h1>{energy.name}</h1>
      </header>
      <RecoilList
        labels={energy.features}
        findState={findReactionWithRelationsState}
        Components={{
          ListItem: EnergyCardFeature,
          Wrapper: ({ children }) => (
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
          ),
        }}
      />
    </div>
  )
}
