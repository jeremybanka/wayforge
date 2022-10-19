import type { FC } from "react"

import { css } from "@emotion/react"
import styled from "@emotion/styled"
import corners, { chamfer } from "corners"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/app/wayforge-client/recoil-list"
import { ListItems } from "~/app/wayforge-client/recoil-list"
import { Luum } from "~/lib/Luum"

import {
  findEnergyWithRelationsState,
  findEnergyState,
} from "../../services/energy"
import { findReactionEnergyState } from "../../services/energy_reaction"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import { findReactionWithRelationsState } from "../../services/reaction"
import { cssCard } from "../Card"
import {
  Span_EnergyAmount,
  Span_VoidIcon,
  SVG_EnergyIcon,
} from "./EnergyIcon_SVG"

type SvgCommandCode = `C` | `L` | `M` | `Q` | `S`

export function writePathPoint(
  x: number,
  y: number,
  command?: SvgCommandCode
): string {
  return command ? `${command} ${x},${y}` : `  ${x},${y}`
}

const energyListCss = css`
  flex-grow: 1;
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 2px;
  gap: 1px;
`

export const Div_EnergyCardFeature: FC<
  RecoilListItemProps<Reaction & ReactionRelations>
> = ({ label, findState }) => {
  const reaction = useRecoilValue(findState(label.id))
  const energy = useRecoilValue(findReactionEnergyState(reaction.id))
  const colorB = Luum.fromJSON(energy.colorB)
  const energyPresentHex = colorB.tint(10).hex
  const energyAbsentHex = colorB.shade(10).hex
  const doesProduceEnergy = reaction.products.some(
    (product) => product.id === energy.id
  )
  const doesConsumeEnergy = reaction.reagents.some(
    (reagent) => reagent.id === energy.id
  )

  return (
    <div
      css={css`
        display: flex;
        flex-flow: column;
        flex-grow: 1;
        /* height: 100%; */
        h2 {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin: 0;
          font-weight: 500;
          font-size: 13.5px;
          color: white;
          small {
            font-size: 10.8px;
          }
        }
        div {
          display: flex;
          align-items: center;
          min-height: 24px;
          height: 100%;
          flex-grow: 1;
        }
      `}
    >
      <h2>
        {reaction.name}
        <small>
          {reaction.time}
          {reaction.timeUnit}
        </small>
      </h2>
      <div>
        <ListItems
          findState={findEnergyState}
          labels={reaction.reagents}
          Components={{
            Wrapper: styled(
              corners(null, null, chamfer, null).options({
                cornerSize: 5,
                noClipping: true,
                below: {
                  color: doesConsumeEnergy ? energyPresentHex : energyAbsentHex,
                  stroke: {
                    color: energyAbsentHex,
                    width: 1,
                  },
                },
              }).span
            )(energyListCss),
            ListItem: Span_EnergyAmount,
            NoItems: () => (
              <Span_VoidIcon
                size={15}
                colorA={colorB.tint(20)}
                colorB={colorB}
              />
            ),
          }}
        />
        <svg
          width="18"
          height="18"
          viewBox="0 0 12 12"
          style={{
            marginRight: -9,
            marginLeft: -9,
            zIndex: 1,
          }}
        >
          <path
            d={[
              writePathPoint(2, 4, `M`),
              writePathPoint(5, 4, `L`),
              writePathPoint(5, 0, `L`),
              writePathPoint(10, 6, `L`),
              writePathPoint(5, 12, `L`),
              writePathPoint(5, 8, `L`),
              writePathPoint(2, 8, `L`),
              `Z`,
            ].join(` `)}
            fill={colorB.shade(5).hex}
            stroke={energyPresentHex}
          />
        </svg>
        <ListItems
          findState={findEnergyState}
          labels={reaction.products}
          Components={{
            Wrapper: styled(
              corners(null, null, null, null).options({
                noClipping: true,
                below: {
                  color: doesProduceEnergy ? energyPresentHex : energyAbsentHex,
                  stroke: {
                    color: energyAbsentHex,
                    width: 1,
                  },
                },
              }).span
            )(energyListCss),
            ListItem: Span_EnergyAmount,
            NoItems: () => (
              <Span_VoidIcon
                size={15}
                colorA={colorB.tint(20)}
                colorB={colorB}
              />
            ),
          }}
        />
      </div>
    </div>
  )
}

export const Data_EnergyCard_B: FC<{ energyId: string }> = ({ energyId }) => {
  const energy = useRecoilValue(findEnergyWithRelationsState(energyId))
  const colorB = Luum.fromJSON(energy.colorB)

  return (
    <data css={cssCard(colorB, colorB)}>
      <article
        css={css`
          height: 384px;
          display: flex;
          flex-flow: column;
          header {
            font-size: 1.5em;
            padding: 22px;
            padding-bottom: 0px;
            display: flex;
            align-items: center;
            gap: 10px;
            h1 {
              margin: 0;
              color: white;
            }
          }
          main {
            display: flex;
            flex-flow: column;
            flex-grow: 1;
            height: 100%;
            gap: 6px;
            padding: 0 22px 22px;
          }
        `}
      >
        <header>
          <SVG_EnergyIcon energyId={energyId} size={36} />
          <h1>{energy.name}</h1>
        </header>
        <main>
          <ListItems
            Components={{ ListItem: Div_EnergyCardFeature }}
            labels={energy.features}
            findState={findReactionWithRelationsState}
          />
        </main>
        <footer />
      </article>
    </data>
  )
}
