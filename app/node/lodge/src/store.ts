import type { StoreApi } from "zustand/vanilla"
import { createStore } from "zustand/vanilla"

import { Join } from "~/packages/anvl/src/join"
import type { ResourceIdentifierObject } from "~/packages/anvl/src/json-api"
import type { Fragment } from "~/packages/anvl/src/object"
import { patch, hasExactProperties } from "~/packages/anvl/src/object"
import { Dictionary } from "~/packages/anvl/src/object/dictionary"
import { isClass } from "~/packages/anvl/src/refinement"

export type Visibility = `hidden` | `private` | `public`

export type Player = {
  perspective: Dictionary<string, string, `trueId`, `displayId`>
}
export const isPlayer = hasExactProperties({
  perspective: isClass(Dictionary),
})
export const createPerspective = (): Player[`perspective`] =>
  new Dictionary({ from: `trueId`, into: `displayId` })

export type Card = {
  rotation: number
  visibility: Visibility
}

export type CardGroup = Card

export type GameState = {
  players: Record<string, Player>
  cards: Record<string, Card>
  cardGroups: Record<string, CardGroup>
  cardsInGroups: Join
}
export type GameStore = StoreApi<GameState>
export interface GameActions
  extends Record<
    string,
    (
      payload:
        | {
            options: any
            targets: Record<string, ResourceIdentifierObject>
          }
        | { options: any }
        | { targets: Record<string, ResourceIdentifierObject> }
    ) => Fragment<GameState>
  > {
  addPlayer: (payload: { options: { id: string } }) => Pick<GameState, `players`>
}

export const initGame = (): GameStore =>
  createStore<GameState>(() => ({
    players: {},
    cards: {},
    cardGroups: {},
    cardsInGroups: new Join(),
  }))

export const useActions = (
  store: GameStore
): { store: GameStore; actions: GameActions } => ({
  store,
  actions: {
    addPlayer: ({ options: { id } }) => ({
      players: {
        [id]: {
          perspective: createPerspective(),
        },
      },
    }),
  },
})

export const useDispatch = ({
  store,
  actions,
}: ReturnType<typeof useActions>): {
  store: GameStore
  actions: GameActions
  dispatch: <Key extends keyof GameActions>(
    action: Key,
    payload: Parameters<GameActions[Key]>[0]
  ) => void
} => ({
  store,
  actions,
  dispatch: (action, payload) =>
    store.setState(patch(store.getState(), actions[action](payload))),
})
