import { rounded } from "corners"
import { motion } from "framer-motion"

export const article = {
	whiteCard: rounded(motion.article, {
		useClipPath: false,
		cornerSize: 10,
		below: [
			// LAYER.SMALL_SHADOW,
			{
				color: `#fff`,
				stroke: { width: 2, color: `#000` },
			},
		],
	}),
	redCard: rounded(motion.article, {
		useClipPath: false,
		cornerSize: 10,
		below: [
			// LAYER.SMALL_SHADOW,
			{
				color: `#e10`,
				stroke: { width: 2, color: `#000` },
			},
		],
	}),
	greyCardSlot: rounded(motion.article, {
		useClipPath: false,
		cornerSize: 10,
		below: [
			{
				color: `var(--bg-shade-2)`,
				stroke: { width: 2, color: `var(--bg-shade-2)` },
			},
		],
	}),
}
