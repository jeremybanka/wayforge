import { rounded } from "corners"
import { motion } from "motion/react"

export const header = {
	roundedInverse: rounded(motion.header, {
		useClipPath: false,
		below: [
			{
				color: `var(--bg-color)`,
			},
			{
				color: `#0002`,
				spread: 1,
				blur: 1,
			},
		],
	}),
}
