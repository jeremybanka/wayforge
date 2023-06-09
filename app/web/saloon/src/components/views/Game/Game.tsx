import type { FC } from "react"

import { css } from "@emotion/react"

import type { CardGroup } from "~/app/node/lodge/src/store/game"
import {
  cardGroupIndex,
  cardIndex,
  cardValuesIndex,
  findCardGroupState,
  groupsOfCardsState,
  ownersOfGroupsState,
  valuesOfCardsState,
} from "~/app/node/lodge/src/store/game"
import { Join } from "~/packages/anvl/src/join"
import { stringSetJsonInterface } from "~/packages/anvl/src/json"

import { Controls } from "./Controls"
import { MyHands } from "./MyDomain"
import { PublicDecks } from "./Public"
import { useRemoteFamily, useRemoteState } from "../../../services/store"

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
