import type { FC } from "react"

import { css } from "@emotion/react"

import type { CardGroup } from "~/app/node/lodge/src/store/game"
import {
  cardGroupIndexJSON,
  cardIndexJSON,
  cardValuesIndexJSON,
  findCardGroupState,
  groupsOfCardsStateJSON,
  ownersOfGroupsStateJSON,
  valuesOfCardsStateJSON,
} from "~/app/node/lodge/src/store/game"

import { Controls } from "./Controls"
import { EnemyDomains } from "./EnemyDomains"
import { MyDomain } from "./MyDomain"
import { Public } from "./Public"
import { useRemoteFamily, useRemoteState } from "../../../services/store"
import { h3 } from "../../containers/<hX>"

export const Game: FC = () => {
  useRemoteState(ownersOfGroupsStateJSON, {
    toJson: (groupsOfCards) => groupsOfCards,
    fromJson: (json) => json as any,
  })
  useRemoteState(valuesOfCardsStateJSON, {
    toJson: (valuesOfCards) => valuesOfCards,
    fromJson: (json) => json as any,
  })
  useRemoteState(groupsOfCardsStateJSON, {
    toJson: (groupsOfCards) => groupsOfCards,
    fromJson: (json) => json as any,
  })
  useRemoteState(cardIndexJSON, {
    toJson: (cardIndex) => cardIndex,
    fromJson: (json) => json as any,
  })
  useRemoteState(cardGroupIndexJSON, {
    toJson: (cardGroupIndex) => cardGroupIndex,
    fromJson: (json) => json as any,
  })
  useRemoteState(cardValuesIndexJSON, {
    toJson: (cardValuesIndex) => cardValuesIndex,
    fromJson: (json) => json as any,
  })

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
