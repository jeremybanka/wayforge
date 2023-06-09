import type { FC } from "react"

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

import {
  socketIdState,
  useRemoteFamily,
  useRemoteState,
  useRemoteTransaction,
} from "../../../services/store"
import { DogEaredButton } from "../../containers/DogEaredButton"

export const Controls: FC = () => {
  const mySocketId = useO(socketIdState)
  const addHand = useRemoteTransaction(addHandTx)
  const spawnClassicDeck = useRemoteTransaction(spawnClassicDeckTX)
  return (
    <div className="controls">
      <h4>Controls</h4>
      <DogEaredButton
        onClick={() =>
          mySocketId
            ? addHand({ playerId: mySocketId, groupId: nanoid() })
            : null
        }
      >
        Add Hand
      </DogEaredButton>
      <DogEaredButton
        onClick={() =>
          spawnClassicDeck(nanoid(), Array.from({ length: 52 }).map(nanoid))
        }
      >
        Add Classic Deck
      </DogEaredButton>
    </div>
  )
}
