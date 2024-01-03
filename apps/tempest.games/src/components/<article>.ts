import { rounded } from "corners"
import { motion } from "framer-motion"

export const article = {
	whiteCard: rounded(motion.article, {
		useClipPath: false,
		cornerSize: 10,
		above: [{ stroke: { width: 2, color: `#000` } }],
		below: [{ color: `#fff` }],
	}),
	redCard: rounded(motion.article, {
		useClipPath: false,
		cornerSize: 10,
		above: [{ stroke: { width: 2, color: `#000` } }],
		below: [{ color: `#e10` }],
	}),
	greyCardSlot: rounded(motion.article, {
		useClipPath: false,
		cornerSize: 10,
		above: [{ stroke: { width: 1, color: `var(--fg-faint)` } }],
		below: [{ color: `var(--bg-shadow-2)` }],
	}),
}
