import type { FC } from "react"
import { useRecoilValue } from "recoil"

import { ListItems } from "~/packages/hamr/src/recoil-tools/RecoilList"
import { Luum } from "~/packages/luum/src"

import { findEnergyWithRelationsState } from "../../services/energy"
import { findReactionWithRelationsState } from "../../services/reaction"
import { SVG_EnergyIcon } from "./EnergyIcon"

import { setCssVars } from "~/packages/hamr/src/react-css-vars"
import scss from "../Card.module.scss"
import { Div_EnergyCardFeature } from "./EnergyCardFeature"
import scssB from "./EnergyCard_B.module.scss"

type SvgCommandCode = `C` | `L` | `M` | `Q` | `S`

export function writePathPoint(
	x: number,
	y: number,
	command?: SvgCommandCode,
): string {
	return command ? `${command} ${x},${y}` : `  ${x},${y}`
}

export const Data_EnergyCard_B: FC<{ energyId: string }> = ({ energyId }) => {
	const energy = useRecoilValue(findEnergyWithRelationsState(energyId))
	const colorB = Luum.fromJSON(energy.colorB)

	return (
		<data
			className={scss.class}
			style={setCssVars({ "--background-color": colorB.hex })}
		>
			<article className={scssB.class}>
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
