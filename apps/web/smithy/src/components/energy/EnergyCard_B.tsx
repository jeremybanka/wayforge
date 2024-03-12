import type { FC } from "react"
import { useRecoilValue } from "recoil"

import { ListItems } from "~/packages/hamr/recoil-tools/src/RecoilList"
import { Luum } from "~/packages/luum/src"

import { findEnergyWithRelationsState } from "../../services/energy"
import { findReactionWithRelationsState } from "../../services/reaction"
import { EnergyIconSVG } from "./EnergyIcon"

import { setCssVars } from "~/packages/hamr/react-css-vars/src"
import scss from "../Card.module.scss"
import { EnergyCardFeatureDiv } from "./EnergyCardFeature"
import scssB from "./EnergyCard_B.module.scss"

type SvgCommandCode = `C` | `L` | `M` | `Q` | `S`

export function writePathPoint(
	x: number,
	y: number,
	command?: SvgCommandCode,
): string {
	return command ? `${command} ${x},${y}` : `  ${x},${y}`
}

export const EnergyCardDataB: FC<{ energyId: string }> = ({ energyId }) => {
	const energy = useRecoilValue(findEnergyWithRelationsState(energyId))
	const colorB = Luum.fromJSON(energy.colorB)

	return (
		<data
			className={scss.class}
			style={setCssVars({ "--background-color": colorB.hex })}
		>
			<article className={scssB.class}>
				<header>
					<EnergyIconSVG energyId={energyId} size={36} />
					<h1>{energy.name}</h1>
				</header>
				<main>
					<ListItems
						Components={{ ListItem: EnergyCardFeatureDiv }}
						labels={energy.features}
						findState={findReactionWithRelationsState}
					/>
				</main>
				<footer />
			</article>
		</data>
	)
}
