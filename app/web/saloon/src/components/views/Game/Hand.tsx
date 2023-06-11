import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"

import { dealCardsTX, groupsOfCardsState } from "~/app/node/lodge/src/store/game"

import { CardBack, CardFace } from "./Card"
import { myHandsIndex } from "./store/my-hands-index"
import { publicDeckIndex } from "./store/public-deck-index"
import { useRemoteTransaction } from "../../../services/store"
import { button } from "../../containers/<button>"
import { div } from "../../containers/<div>"

export const Hand: FC<{ id: string }> = ({ id }) => {
  const isMyHand = useO(myHandsIndex).includes(id)
  const cardIds = useO(groupsOfCardsState).getRelatedIds(id)
  const publicDeckIds = useO(publicDeckIndex)

  const dealCards = useRemoteTransaction(dealCardsTX)

  return (
    <AnimatePresence>
      <div.dropShadowDiagon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button.flashFire
          onClick={() =>
            dealCards({ deckId: publicDeckIds[0], handId: id, count: 1 })
          }
        >
          Deal
        </button.flashFire>
        <div>{cardIds.length}</div>
        <div
          css={css`
            display: flex;
          `}
        >
          {isMyHand
            ? cardIds.map((cardId) => <CardFace key={cardId} id={cardId} />)
            : cardIds.map((cardId) => <CardBack key={cardId} id={cardId} />)}
        </div>
      </div.dropShadowDiagon>
    </AnimatePresence>
  )
}
