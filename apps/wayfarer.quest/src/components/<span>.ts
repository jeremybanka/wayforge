import { motion } from "framer-motion"

import { BackwardDiagonal10, ChamferedTop } from "./corners/factories"

export const span = {
	chamferedTop: ChamferedTop(`span`, {
		useClipPath: false,
		below: [{ color: `var(--background-color)` }],
	}),
	diagon: BackwardDiagonal10(motion.span, {
		useClipPath: true,
		above: [
			{
				stroke: {
					width: 4,
					color: `white`,
				},
			},
		],
	}),
}
