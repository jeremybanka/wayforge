import { rounded } from "corners"
import { motion } from "framer-motion"

export const header = {
  roundedInverse: rounded(motion.header, {
    noClipping: true,
    below: [
      {
        color: `var(--fg-color)`,
      },
    ],
  }),
}
