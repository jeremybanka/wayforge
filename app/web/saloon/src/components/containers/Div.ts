import { motion } from "framer-motion"

import { ForwardDiagonal } from "./corners"
import { LAYER } from "./LAYER"

export const Div = {
  DropShadowDiagon: ForwardDiagonal(motion.div, {
    noClipping: true,
    below: [LAYER.SMALL_SHADOW, LAYER.BG],
  }),
}
