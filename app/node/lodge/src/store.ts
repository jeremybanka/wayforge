import { nanoid } from "nanoid"
import type { StoreApi } from "zustand/vanilla"
import { createStore } from "zustand/vanilla"

import { Join } from "~/packages/anvl/src/join"
import type {
  Resource,
  ResourceIdentifierObject,
} from "~/packages/anvl/src/json-api"
import type { Fragment } from "~/packages/anvl/src/object"
import { patch, hasExactProperties } from "~/packages/anvl/src/object"
import { Dictionary } from "~/packages/anvl/src/object/dictionary"
import { isClass } from "~/packages/anvl/src/refinement"
import type { Visibility } from "~/packages/obscurity/src"

export interface GameEntity extends Resource {
  id: string
  type: string
  attributes: { visibility: Visibility }
}

export type Player = {
  perspective: Dictionary<string, string, `trueId`, `virtualId`>
}
export const isPlayer = hasExactProperties({
  perspective: isClass(Dictionary),
})
export const createPerspective = (): Player[`perspective`] =>
  new Dictionary({ from: `trueId`, into: `virtualId` })

export const createPlayer = (): Player => ({
  perspective: createPerspective(),
})

export interface Card {
  rotation: number
}

export type CardGroup = Card

export type GameState = {
  playerStatus: Record<string, string>
  players: Record<string, Player>
  cards: Record<string, Card>
  cardGroups: Record<string, CardGroup>
  cardValues: Record<string, { content: string }>
  cardsInGroups: Join
  valuesOfCards: Join
}

export type GameStore = StoreApi<GameState>

export const GAME_ACTION_KEYS = [
  `ADD_PLAYER`,
  `ADD_CARD_VALUE`,
  `ADD_CARD`,
] as const
export type GameActionKey = (typeof GAME_ACTION_KEYS)[number]
export type GameActionKeyWrapped = `ACTION:${GameActionKey}`
export const unwrapGameActionKey = (key: GameActionKeyWrapped): GameActionKey =>
  key.split(`:`)[1] as GameActionKey
export const wrapGameActionKey = (key: GameActionKey): GameActionKeyWrapped =>
  `ACTION:${key}` as GameActionKeyWrapped

export const STATUS_EVENT_KEYS = [`FOCUS`, `MESSAGE`, `EMOTE`] as const
export type StatusEventKey = (typeof STATUS_EVENT_KEYS)[number]
export type StatusEventKeyWrapped = `STATUS:${StatusEventKey}`
export const unwrapStatusEventKey = (
  key: StatusEventKeyWrapped
): StatusEventKey => key.split(`:`)[1] as StatusEventKey
export const wrapStatusEventKey = (key: StatusEventKey): StatusEventKeyWrapped =>
  `STATUS:${key}` as StatusEventKeyWrapped

export const refineSignal = (
  signal: string
):
  | { action: GameActionKeyWrapped }
  | { status: StatusEventKeyWrapped }
  | { unknown: string } => {
  const [type, key] = signal.split(`:`)
  if (type === `ACTION`) {
    if (GAME_ACTION_KEYS.includes(key as GameActionKey)) {
      return { action: signal as GameActionKeyWrapped }
    }
  }
  if (type === `STATUS`) {
    if (STATUS_EVENT_KEYS.includes(key as StatusEventKey)) {
      return { status: signal as StatusEventKeyWrapped }
    }
  }
  return { unknown: signal }
}

export type StatusEventPayload = any
export interface StatusEvents
  extends Record<
    StatusEventKey,
    (payload: StatusEventPayload) => Fragment<GameState[`playerStatus`]>
  > {
  FOCUS: (payload: {
    options: { id: string }
  }) => Partial<GameState[`playerStatus`]>
  MESSAGE: (payload: {
    options: { message: string }
  }) => Partial<GameState[`playerStatus`]>
  EMOTE: (payload: {
    options: { emote: string }
  }) => Partial<GameState[`playerStatus`]>
}

export type GameActionPayload = { id: string } & (
  | {
      options: any
      targets: Record<string, ResourceIdentifierObject>
    }
  | { options: any }
  | { targets: Record<string, ResourceIdentifierObject> }
)
export interface GameActions
  extends Record<
    GameActionKey,
    (payload: GameActionPayload) => Fragment<GameState>
  > {
  ADD_PLAYER: (payload: {
    id: string
    options: { id: string }
  }) => Pick<GameState, `players`>
  ADD_CARD_VALUE: (payload: {
    id: string
    options: { content: string }
  }) => Pick<GameState, `cardValues`>
  ADD_CARD: (payload: {
    id: string
    targets: { cardValue: { id: string; type: `cardValue` } }
  }) => Pick<GameState, `cards` | `valuesOfCards`>
}

export const initGame = (): GameStore =>
  createStore<GameState>(() => ({
    playerStatus: {},
    players: {},
    cards: {},
    cardGroups: {},
    cardValues: {},
    cardsInGroups: new Join(),
    valuesOfCards: new Join(),
  }))

export const configureActions = (config: {
  idFn: () => string
}): ((store: GameStore) => { store: GameStore; actions: GameActions }) => {
  const useActions: ReturnType<typeof configureActions> = (store) => ({
    store,
    actions: {
      ADD_PLAYER: ({ options: { id } }) => ({
        players: {
          [id]: {
            perspective: createPerspective(),
          },
        },
      }),
      ADD_CARD_VALUE: ({ options: { content } }) => {
        const id = config.idFn()
        return {
          cardValues: {
            [id]: {
              content,
            },
          },
        }
      },
      ADD_CARD: ({ targets: { cardValue } }) => {
        const id = config.idFn()
        return {
          cards: {
            [id]: {
              rotation: 0,
            },
          },
          valuesOfCards: store.getState().valuesOfCards.set(cardValue.id, id),
        }
      },
    },
  })
  return useActions
}
export const useActions = configureActions({ idFn: nanoid })

export const useDispatch = ({
  store,
  actions,
}: ReturnType<typeof useActions>): {
  store: GameStore
  actions: GameActions
  dispatch: <Key extends keyof GameActions>(
    action: Key,
    payload: Parameters<GameActions[Key]>[0]
  ) => Fragment<GameState>
} => ({
  store,
  actions,
  dispatch: (key, payload) => {
    const delta = actions[key](payload as any)
    store.setState((state) => patch(state, delta))
    return delta
  },
})
