import { motion } from "framer-motion"

import { CurledLeft } from "./corners/factories"
import { LAYER } from "./corners/layers"

export const button = {
	curledLeft: CurledLeft(motion.button, {
		useClipPath: false,
		below: [LAYER.FG_STROKE],
	}),
}
