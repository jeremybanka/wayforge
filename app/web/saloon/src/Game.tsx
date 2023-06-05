import type { FC } from "react"

import { css } from "@emotion/react"
import * as AtomIO from "atom.io"
import { useO } from "atom.io/react"
import corners, { chamfer } from "corners"
import { nanoid } from "nanoid"

import type { CardGroup } from "~/app/node/lodge/src/store/game"
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
  useRemoteFamily,
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
    console.log(
      [...cardGroupIds].map((id) => [
        id,
        ownersOfGroups.getRelatedId(id),
        get(findCardGroupState(id)),
      ])
    )
    const unownedCardGroupIds = [...cardGroupIds].filter(
      (cardGroupId) =>
        ownersOfGroups.getRelatedId(cardGroupId) === undefined &&
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

const MyHands: FC = () => {
  const myHands = useO(myHandsIndex)
  return (
    <div className="my-hands">
      <h4>My Hands</h4>
      <div>
        {myHands.map((id) => (
          <Deck key={id} id={id} />
        ))}
      </div>
    </div>
  )
}

const PublicDecks: FC = () => {
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

export const Controls: FC = () => {
  const mySocketId = useO(socketIdState)
  const addHand = useRemoteTransaction(addHandTx)
  const addClassic52 = useRemoteTransaction(add52ClassicCardsTX)
  const spawnClassicDeck = useRemoteTransaction(spawnClassicDeckTX)
  return (
    <div className="controls">
      <h4>Controls</h4>
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
    </div>
  )
}

export const Game: FC = () => {
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

  useRemoteFamily(findCardGroupState, {
    toJson: (v) => v,
    fromJson: (j) => j as CardGroup,
  })

  return (
    <>
      <header
        css={css`
          background-color: #9992;
        `}
      >
        <h3>Game</h3>
        <MyHands />
        <PublicDecks />
        <Controls />
      </header>
    </>
  )
}
