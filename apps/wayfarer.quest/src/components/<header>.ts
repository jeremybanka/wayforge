import { rounded } from "corners"
import { motion } from "framer-motion"

import { Auspicious0 } from "./corners/factories"

export const header = {
	auspicious0: Auspicious0(motion.header, {
		useClipPath: false,
		below: [
			{
				color: `#7772`,
			},
		],
	}),
}
