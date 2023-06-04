import type { FC } from "react"

import { css } from "@emotion/react"
import * as AtomIO from "atom.io"
import { useO } from "atom.io/react"
import corners, { chamfer } from "corners"
import { nanoid } from "nanoid"

import {
  add52ClassicCardsTX,
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
  useRemoteState,
  useRemoteTransaction,
} from "./services/store"

const myHandsIndex = AtomIO.selector<string[]>({
  key: `myHands`,
  get: ({ get }) => {
    const myId = get(socketIdState)
    console.log(`myId`, myId)
    if (!myId) {
      return []
    }
    const ownersOfGroups = get(ownersOfGroupsState)
    const myGroups = ownersOfGroups.getRelatedIds(myId)
    const myHands = myGroups.filter((id) => get(findCardGroupState(id)).type)
    console.log({ ownersOfGroups, myGroups, myHands })
    return myHands
  },
})

const publicDeckIndex = AtomIO.selector<string[]>({
  key: `publicDeckIndex`,
  get: ({ get }) => {
    const ownersOfGroups = get(ownersOfGroupsState)
    const cardGroupIds = get(cardGroupIndex)
    const unownedCardGroupIds = [...cardGroupIds].filter(
      (cardGroupId) =>
        !ownersOfGroups.getRelatedId(cardGroupId) &&
        get(findCardGroupState(cardGroupId)).type === `deck`
    )
    return unownedCardGroupIds
  },
})

const SemiChamfered = corners(chamfer, null).size(5)
const DeckWrap = SemiChamfered.div.with({
  below: [
    {
      color: `var(--bg-color)`,
      stroke: { width: 2, color: `var(--fg-color)` },
    },
  ],
})
export const Deck: FC<{ id: string }> = ({ id }) => {
  const cardIds = useO(groupsOfCardsState).getRelatedIds(id)
  return <DeckWrap>{cardIds.length}</DeckWrap>
}

export const Game: FC = () => {
  const mySocketId = useO(socketIdState)
  const myHands = useO(myHandsIndex)
  const publicDeckIds = useO(publicDeckIndex)
  useRemoteState(ownersOfGroupsState, {
    toJson: (groupsOfCards) => groupsOfCards.toJSON(),
    fromJson: (json) => new Join(json as any),
  })
  useRemoteState(valuesOfCardsState, {
    toJson: (valuesOfCards) => valuesOfCards.toJSON(),
    fromJson: (json) => new Join(json as any),
  })
  useRemoteState(groupsOfCardsState, {
    toJson: (groupsOfCards) => groupsOfCards.toJSON(),
    fromJson: (json) => new Join(json as any),
  })
  useRemoteState(cardIndex, stringSetJsonInterface)
  useRemoteState(cardGroupIndex, stringSetJsonInterface)
  useRemoteState(cardValuesIndex, stringSetJsonInterface)
  const addHand = useRemoteTransaction(addHandTx)
  const addClassic52 = useRemoteTransaction(add52ClassicCardsTX)
  const spawnClassicDeck = useRemoteTransaction(spawnClassicDeckTX)

  return (
    <>
      <header
        css={css`
          background-color: #9992;
        `}
      >
        <h3>Game</h3>
        {myHands.map((id) => (
          <div key={id}>{id}</div>
        ))}
        {publicDeckIds.map((id) => (
          <Deck key={id} id={id} />
        ))}
        <button
          onClick={() =>
            mySocketId
              ? addHand({ playerId: mySocketId, groupId: nanoid() })
              : null
          }
        >
          Add Hand
        </button>
        <button
          onClick={() =>
            spawnClassicDeck(nanoid(), Array.from({ length: 52 }).map(nanoid))
          }
        >
          Add Classic Deck
        </button>
      </header>
    </>
  )
}
