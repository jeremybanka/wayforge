import Emotion from "@emotion/styled"
import { rounded } from "corners"
import { motion } from "framer-motion"

import { LAYER } from "./corners/layers"

const styled = {
  RoundedCard: Emotion(
    rounded(motion.article, {
      useClipPath: false,
      cornerSize: 5,
      below: [
        LAYER.SMALL_SHADOW,
        {
          color: `#fff`,
        },
      ],
    })
  ),
}

export const article = {
  roundedWhite: styled.RoundedCard`
    height: 120px;
    width: 80px;
    display: flex;
    flex-shrink: 0;
    svg:last-of-type {
      height: 100% !important;
      width: 100% !important;
    }
  `,
}
