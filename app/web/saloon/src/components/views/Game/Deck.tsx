import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"

import {
  shuffleDeckTX,
  groupsOfCardsState,
} from "~/app/node/lodge/src/store/game"

import { CardBack } from "./Card"
import { useRemoteTransaction } from "../../../services/store"
import { button } from "../../containers/<button>"
import { div } from "../../containers/<div>"

export const Deck: FC<{ id: string }> = ({ id }) => {
  const cardIds = useO(groupsOfCardsState).getRelatedIds(id)

  const shuffle = useRemoteTransaction(shuffleDeckTX)

  return (
    <>
      <div.dropShadowDiagon
        css={css`
          padding: 5px;
        `}
      >
        {cardIds.length}
      </div.dropShadowDiagon>
      <div
        css={css`
          display: flex;
          flex-flow: column-reverse nowrap;
          > * ~ * {
            margin-bottom: -119.5px;
          }
        `}
      >
        {cardIds.map((cardId) => (
          <CardBack key={cardId} id={cardId} />
        ))}
      </div>
      <button.flashFire onClick={() => shuffle({ deckId: id })}>
        Shuffle
      </button.flashFire>
    </>
  )
}
