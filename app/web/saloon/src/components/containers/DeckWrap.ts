import { motion } from "framer-motion"

import { SemiChamfered } from "./corners"

export const DeckWrap = SemiChamfered(motion.div, {
  noClipping: true,
  below: [
    {
      color: `#0005`,
      blur: 2,
      offset: { x: 0, y: -2 },
    },
    {
      color: `var(--bg-color)`,
      stroke: { width: 2, color: `var(--fg-color)` },
    },
  ],
})
