import Emotion from "@emotion/styled"
import { motion } from "framer-motion"

import { CurledLeft } from "./corners"
import { LAYER } from "./LAYER"

export const styled = {
  ButtonCurledLeft: Emotion(
    CurledLeft(motion.button, {
      noClipping: true,
      below: [LAYER.FG_OUTLINE],
    })
  ),
}

export const Button = {
  // <Button.FlashFire>
  FlashFire: styled.ButtonCurledLeft`
    font-family: Uruz;
    font-size: 18px;
    font-weight: 500;
    border: none;
    padding: 3px 13px 5px;
    cursor: pointer;
    position: relative;
    &:hover {
      transform: scale(1.1);
      z-index: 10000 !important;
      > svg > path {
        fill: yellow;
      }
    }
    &:active {
      transform: scale(0.95);
      > svg > path {
        fill: orange;
      }
    }
    &:hover,
    &:focus,
    &:hover:active {
      @media (prefers-color-scheme: dark) {
        color: var(--bg-color);
      }
    }
  `,
}
