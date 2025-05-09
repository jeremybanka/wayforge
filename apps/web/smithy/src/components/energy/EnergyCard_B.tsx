import { useO } from "atom.io/react"
import { ListItems } from "hamr/atom.io-tools"
import type { FC } from "react"

import { setCssVars } from "~/packages/hamr/react-css-vars/src"
import { Luum } from "~/packages/luum/src"

import { energyWithRelationsSelectors } from "../../services/energy"
import { reactionWithRelationsAtoms } from "../../services/reaction"
import scss from "../Card.module.scss"
import scssB from "./EnergyCard_B.module.scss"
import { Div_EnergyCardFeature } from "./EnergyCardFeature"
import { SVG_EnergyIcon } from "./EnergyIcon"

type SvgCommandCode = `C` | `L` | `M` | `Q` | `S`

export function writePathPoint(
	x: number,
	y: number,
	command?: SvgCommandCode,
): string {
	return command ? `${command} ${x},${y}` : `  ${x},${y}`
}

export const Data_EnergyCard_B: FC<{ energyId: string }> = ({ energyId }) => {
	const energy = useO(energyWithRelationsSelectors, energyId)
	const colorB = Luum.fromJSON(energy.colorB)

	return (
		<data
			className={scss[`class`]}
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
						family={reactionWithRelationsAtoms}
					/>
				</main>
				<footer />
			</article>
		</data>
	)
}
