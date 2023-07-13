import { rounded } from "corners"
import { motion } from "framer-motion"

export const header = {
	roundedInverse: rounded(motion.header, {
		useClipPath: false,
		below: [
			{
				color: `var(--fg-color)`,
			},
		],
	}),
}
