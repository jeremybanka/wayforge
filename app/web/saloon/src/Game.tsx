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
    if (!myId) {
      return []
    }
    const ownersOfGroups = get(ownersOfGroupsState)
    const myGroups = ownersOfGroups.getRelatedIds(myId)
    const myHands = myGroups.filter((id) => get(findCardGroupState(id)).type)
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
        ownersOfGroups.getRelatedId(cardGroupId) === undefined &&
        get(findCardGroupState(cardGroupId)).type === `deck`
    )
    return unownedCardGroupIds
  },
})

const SemiChamfered = corners(chamfer, null).size(5)
const DogEared = corners(null, null, chamfer, null).size(5)

const DogEaredButton = styled(
  DogEared(motion.button, {
    noClipping: true,
    below: [
      {
        color: `white`,
        stroke: { width: 2, color: `var(--fg-color)` },
      },
    ],
  })
)`
  font-family: Uruz;
  font-size: 18px;
  font-weight: 500;
  border: none;
  padding: 3px 13px 5px;
  cursor: pointer;
  position: relative;
  &:hover {
    transform: scale(1.1);
    z-index: 10000 !important;
    > svg > path {
      fill: yellow;
    }
  }
  &:active {
    transform: scale(0.95);
    > svg > path {
      fill: orange;
    }
  }
`

const DeckWrap = SemiChamfered(motion.div, {
  noClipping: true,
  below: [
    {
      color: `#0005`,
      blur: 2,
      offset: { x: 0, y: -2 },
    },
    {
      color: `var(--bg-color)`,
      stroke: { width: 2, color: `var(--fg-color)` },
    },
  ],
})

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
export const CardFace: FC<{ id: string }> = ({ id }) => {
  const value = useO(valuesOfCardsState).getRelatedId(id)
  return (
    <AnimatePresence>
      <DeckWrap
        css={css`
          padding: 5px;
        `}
      >
        {value}
      </DeckWrap>
    </AnimatePresence>
  )
}
export const CardBack: FC<{ id: string }> = () => {
  return (
    <AnimatePresence>
      <DeckWrap
        css={css`
          padding: 5px;
        `}
      ></DeckWrap>
    </AnimatePresence>
  )
}

export const Hand: FC<{ id: string }> = ({ id }) => {
  const isMyHand = useO(myHandsIndex).includes(id)
  const cardIds = useO(groupsOfCardsState).getRelatedIds(id)
  const publicDeckIds = useO(publicDeckIndex)

  const dealCards = useRemoteTransaction(dealCardsTX)

  return (
    <AnimatePresence>
      <DeckWrap
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <DogEaredButton
          onClick={() =>
            dealCards({ deckId: publicDeckIds[0], handId: id, count: 1 })
          }
        >
          Deal
        </DogEaredButton>
        {isMyHand
          ? cardIds.map((cardId) => <CardFace key={cardId} id={cardId} />)
          : cardIds.map((cardId) => <CardBack key={cardId} id={cardId} />)}
        <div>{cardIds.length}</div>
      </DeckWrap>
    </AnimatePresence>
  )
}

const MyHands: FC = () => {
  const myHands = useO(myHandsIndex)
  return (
    <div className="my-hands">
      <h4>My Hands</h4>
      <div>
        {myHands.map((id) => (
          <Hand key={id} id={id} />
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
