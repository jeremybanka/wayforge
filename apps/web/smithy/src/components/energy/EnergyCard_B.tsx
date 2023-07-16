import type { FC } from "react"

import { css } from "@emotion/react"
import { useRecoilValue } from "recoil"

import type { RecoilListItemProps } from "~/packages/hamr/src/recoil-tools/RecoilList"
import { ListItems } from "~/packages/hamr/src/recoil-tools/RecoilList"
import { Luum } from "~/packages/luum/src"

import { SVG_EnergyIcon } from "./EnergyIcon"
import { findEnergyWithRelationsState } from "../../services/energy"
import type { Reaction, ReactionRelations } from "../../services/reaction"
import { findReactionWithRelationsState } from "../../services/reaction"
import { cssCard } from "../Card"
import { ReactionIcon_INTERNAL } from "../reaction/ReactionIcon"

type SvgCommandCode = `C` | `L` | `M` | `Q` | `S`

export function writePathPoint(
	x: number,
	y: number,
	command?: SvgCommandCode,
): string {
	return command ? `${command} ${x},${y}` : `  ${x},${y}`
}

export const Div_EnergyCardFeature: FC<
	RecoilListItemProps<Reaction & ReactionRelations>
> = ({ label, findState }) => {
	const reaction = useRecoilValue(findState(label.id))

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
			<ReactionIcon_INTERNAL reaction={reaction} size={20} mode="fancy" />
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
