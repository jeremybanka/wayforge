import { motion } from "framer-motion"

import { ForwardDiagonal } from "./corners/factories"
import { LAYER } from "./corners/layers"

export const div = {
  dropShadowDiagon: ForwardDiagonal(motion.div, {
    useClipPath: false,
    below: [LAYER.SMALL_SHADOW, LAYER.BG],
  }),
}
