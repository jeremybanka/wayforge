import type { SerializedStyles } from "@emotion/react"
import { css } from "@emotion/react"
import corners, { chamfer } from "corners"

import type { Luum } from "~/packages/Luum"

export const CARD_WIDTH = 252
export const CARD_HEIGHT = 360
export const CARD_PADDING = 12

export const cssCard = (colorA: Luum, colorB: Luum): SerializedStyles => css`
  background: ${colorA.hex};
  font-family: "Uruz";
  font-size: 10.8px;
  width: ${CARD_WIDTH + CARD_PADDING * 2}px;
  height: ${CARD_HEIGHT + CARD_PADDING * 2}px;
  position: relative;
`

export const rightSlant = corners(null, chamfer)
