import { rounded } from "corners"
import { motion } from "framer-motion"

import { LAYER } from "./corners/layers"

export const article = {
	roundedWhite: rounded(motion.article, {
		useClipPath: false,
		cornerSize: 10,
		below: [
			LAYER.SMALL_SHADOW,
			{
				color: `#fff`,
			},
		],
	}),
}
