import { useId } from "react"
import type { FC } from "react"
import { useRecoilValue } from "recoil"

import { Luum } from "~/packages/luum/src"

import { setCssVars } from "~/packages/hamr/react-css-vars/dist"
import { findEnergyState } from "../../services/energy"
import { CARD_HEIGHT, CARD_PADDING, CARD_WIDTH } from "../Card"
import { SVG_EnergyIcon } from "./EnergyIcon"

import scss from "../Card.module.scss"
import scssA from "./EnergyCard_A.module.scss"

export const Data_EnergyCard_A: FC<{ energyId: string }> = ({ energyId }) => {
	const domId = useId()
	const energy = useRecoilValue(findEnergyState(energyId))

	const colorA = Luum.fromJSON(energy.colorA)
	const colorB = Luum.fromJSON(energy.colorB)

	return (
		<data
			className={scss.class}
			style={setCssVars({
				"--background-color": colorA.hex,
				"--background-color-shade-5": colorA.shade(5).hex,
				"--text-color": colorB.hex,
				"--card-width": `${CARD_WIDTH}px`,
				"--card-height": `${CARD_HEIGHT}px`,
				"--card-padding": `${CARD_PADDING}px`,
			})}
		>
			<article className={scssA.class}>
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
