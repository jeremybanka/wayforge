import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"

import {
  shuffleDeckTX,
  groupsOfCardsState,
} from "~/app/node/lodge/src/store/game"

import { useRemoteTransaction } from "../../../services/store"
import { Button } from "../../containers/Button"
import { Div } from "../../containers/Div"

export const Deck: FC<{ id: string }> = ({ id }) => {
  const cardIds = useO(groupsOfCardsState).getRelatedIds(id)

  const shuffle = useRemoteTransaction(shuffleDeckTX)

  return (
    <>
      <Div.DropShadowDiagon
        css={css`
          padding: 5px;
        `}
      >
        {cardIds.length}
      </Div.DropShadowDiagon>
      <Button.FlashFire onClick={() => shuffle({ deckId: id })}>
        Shuffle
      </Button.FlashFire>
    </>
  )
}
