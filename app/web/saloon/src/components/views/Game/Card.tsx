import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"

import { valuesOfCardsState } from "~/app/node/lodge/src/store/game"
import * as PLAYING_CARDS from "~/app/node/lodge/src/store/game/playing-card-data"

import { article } from "../../containers/<article>"
import { PlayingCards } from "../../PlayingCards"

export const CardFace: FC<{ id: string }> = ({ id }) => {
  const value = useO(valuesOfCardsState).getRelatedId(id)
  const PlayingCard = PlayingCards[value as keyof typeof PlayingCards]
  return (
    <AnimatePresence>
      <article.roundedWhite layoutId={id}>
        {PlayingCard ? <PlayingCard /> : null}
      </article.roundedWhite>
    </AnimatePresence>
  )
}
export const CardBack: FC<{ id: string }> = ({ id }) => {
  return (
    <AnimatePresence>
      <article.roundedWhite layoutId={id}>
        {/* <PlayingCards.Back /> */}
      </article.roundedWhite>
    </AnimatePresence>
  )
}
