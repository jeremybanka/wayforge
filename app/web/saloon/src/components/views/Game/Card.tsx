import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"

import { valuesOfCardsState } from "~/app/node/lodge/src/store/game"

import { div } from "../../containers/<div>"

export const CardFace: FC<{ id: string }> = ({ id }) => {
  const value = useO(valuesOfCardsState).getRelatedId(id)
  return (
    <AnimatePresence>
      <div.dropShadowDiagon
        css={css`
          padding: 5px;
        `}
      >
        {value}
      </div.dropShadowDiagon>
    </AnimatePresence>
  )
}
export const CardBack: FC<{ id: string }> = () => {
  return (
    <AnimatePresence>
      <div.dropShadowDiagon
        css={css`
          padding: 5px;
        `}
      ></div.dropShadowDiagon>
    </AnimatePresence>
  )
}
