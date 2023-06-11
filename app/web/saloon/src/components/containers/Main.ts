import { motion } from "framer-motion"

import { Auspicious } from "./corners"

export const Main = {
  Auspicious: Auspicious(motion.main, {
    noClipping: true,
    below: [
      {
        color: `#7772`,
      },
    ],
  }),
}
