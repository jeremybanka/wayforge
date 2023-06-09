import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"

import { valuesOfCardsState } from "~/app/node/lodge/src/store/game"

import { DeckWrap } from "../../containers/DeckWrap"

export const CardFace: FC<{ id: string }> = ({ id }) => {
  const value = useO(valuesOfCardsState).getRelatedId(id)
  return (
    <AnimatePresence>
      <DeckWrap
        css={css`
          padding: 5px;
        `}
      >
        {value}
      </DeckWrap>
    </AnimatePresence>
  )
}
export const CardBack: FC<{ id: string }> = () => {
  return (
    <AnimatePresence>
      <DeckWrap
        css={css`
          padding: 5px;
        `}
      ></DeckWrap>
    </AnimatePresence>
  )
}
