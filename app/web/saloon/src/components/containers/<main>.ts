import { motion } from "framer-motion"

import { Auspicious } from "./corners/factories"

export const main = {
  auspicious: Auspicious(motion.main, {
    noClipping: true,
    below: [
      {
        color: `#7772`,
      },
    ],
  }),
}
