import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"

import {
  shuffleDeckTX,
  groupsOfCardsState,
} from "~/app/node/lodge/src/store/game"

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
      <button.flashFire onClick={() => shuffle({ deckId: id })}>
        Shuffle
      </button.flashFire>
    </>
  )
}
