import { css } from "@emotion/react"
import { useId } from "react"
import type { FC } from "react"
import { useRecoilValue } from "recoil"

import { Luum } from "~/packages/luum/src"

import { findEnergyState } from "../../services/energy"
import { CARD_HEIGHT, CARD_WIDTH, cssCard } from "../Card"
import { SVG_EnergyIcon } from "./EnergyIcon"

export const Data_EnergyCard_A: FC<{ energyId: string }> = ({ energyId }) => {
	const domId = useId()
	const energy = useRecoilValue(findEnergyState(energyId))

	const colorA = Luum.fromJSON(energy.colorA)
	const colorB = Luum.fromJSON(energy.colorB)

	return (
		<data css={cssCard(colorA, colorB)}>
			<article
				css={css`
          display: flex;
          flex-flow: column;
          width: ${CARD_WIDTH + 24}px;
          height: ${CARD_HEIGHT + 24}px;
          header {
            font-size: 1.5em;
            padding: 22px;
            position: absolute;
            top: 0;
            left: 0;
          }
          main {
            flex-grow: 1;
            display: flex;
            flex-flow: column;
            padding-top: 15px;
            padding-bottom: 40px;
            > div {
              display: flex;
              flex-flow: row;
              width: 100%;
              height: 10px;
              padding: 0 18px;
              flex-grow: 1;
              font-size: 7.2px;
              justify-content: flex-end;
              align-items: center;
              color: ${colorB.hex};
              ~ div {
                border-top: 1px solid ${colorA.shade(5).hex};
              }
            }
          }
        `}
			>
				<header>
					<SVG_EnergyIcon energyId={energyId} size={36} />
				</header>
				<main>
					{Array(30)
						.fill(0)
						.map((_, i) => (
							<div key={`${domId}bar${i}1`}>{i + 1}</div>
						))}
				</main>
			</article>
		</data>
	)
}
