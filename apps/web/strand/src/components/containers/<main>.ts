import { motion } from "motion/react"

import { Auspicious1 } from "./corners/factories"

export const main = {
	auspicious: Auspicious1(motion.main, {
		useClipPath: false,
		below: [
			{
				color: `#7772`,
			},
		],
	}),
}
