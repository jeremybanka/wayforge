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
import { EnemyDomains } from "./EnemyDomains"
import { MyDomain } from "./MyDomain"
import { Public } from "./Public"
import { useRemoteFamily, useRemoteState } from "../../../services/store"
import { h3 } from "../../containers/<hX>"

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
    <div
      css={css`
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex-grow: 1;
        border: 1px solid #9992;
        background-color: #bbb1;
        h3 {
          padding: 0px 32px 0px 8px;
          background-color: #9992;
          margin: 0;
        }
        div {
          padding: 5px;
          background-color: #9992;
          width: 100%;
        }
      `}
    >
      <h3.wedge>Game</h3.wedge>
      <EnemyDomains />
      <Public />
      <Controls />
      <MyDomain />
    </div>
  )
}
