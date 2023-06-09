import * as React from "react"

import { css } from "@emotion/react"
import styled from "@emotion/styled"
import * as AtomIO from "atom.io"
import { useO } from "atom.io/react"
import corners, { chamfer } from "corners"
import { AnimatePresence, motion } from "framer-motion"
import { nanoid } from "nanoid"

import type { CardGroup } from "~/app/node/lodge/src/store/game"
import {
  shuffleDeckTX,
  dealCardsTX,
  addHandTx,
  cardGroupIndex,
  cardIndex,
  cardValuesIndex,
  findCardGroupState,
  groupsOfCardsState,
  ownersOfGroupsState,
  spawnClassicDeckTX,
  valuesOfCardsState,
} from "~/app/node/lodge/src/store/game"
import { Join } from "~/packages/anvl/src/join"
import { stringSetJsonInterface } from "~/packages/anvl/src/json"

import { Deck } from "./Deck"
import { publicDeckIndex } from "./store/public-deck-index"
import {
  socketIdState,
  useRemoteFamily,
  useRemoteState,
  useRemoteTransaction,
} from "../../../services/store"

export const PublicDecks: React.FC = () => {
  const publicDeckIds = useO(publicDeckIndex)
  return (
    <div className="public-decks">
      <h4>Public Decks</h4>
      <div>
        {publicDeckIds.map((id) => (
          <Deck key={id} id={id} />
        ))}
      </div>
    </div>
  )
}
