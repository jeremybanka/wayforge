import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"

import {
  shuffleDeckTX,
  groupsOfCardsState,
} from "~/app/node/lodge/src/store/game"

import { useRemoteTransaction } from "../../../services/store"
import { DeckWrap } from "../../containers/DeckWrap"
import { DogEaredButton } from "../../containers/DogEaredButton"

export const Deck: FC<{ id: string }> = ({ id }) => {
  const cardIds = useO(groupsOfCardsState).getRelatedIds(id)

  const shuffle = useRemoteTransaction(shuffleDeckTX)

  return (
    <>
      <DeckWrap
        css={css`
          padding: 5px;
        `}
      >
        {cardIds.length}
      </DeckWrap>
      <DogEaredButton onClick={() => shuffle({ deckId: id })}>
        Shuffle
      </DogEaredButton>
    </>
  )
}
