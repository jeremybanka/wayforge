import { rounded } from "corners"
import { motion } from "framer-motion"

import { Auspicious0 } from "./corners/factories"

export const header = {
  auspicious0: Auspicious0(motion.header, {
    noClipping: true,
    below: [
      {
        color: `#7772`,
      },
    ],
  }),
  roundedInverse: rounded(motion.header, {
    noClipping: true,
    below: [
      {
        color: `var(--fg-color)`,
      },
    ],
  }),
}
