import { nanoid } from "nanoid"
import type { StoreApi } from "zustand/vanilla"
import { createStore } from "zustand/vanilla"

import type { Parcel } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type {
  JsonApiResource,
  ResourceAttributes,
  ResourceIdentifierObject,
} from "~/packages/anvl/src/json-api"
import type { Fragment, KeysExtending } from "~/packages/anvl/src/object"
import { patch } from "~/packages/anvl/src/object"
import { Perspective } from "~/packages/occlusion/src"

export class Player {
  public perspective: Perspective

  public constructor() {
    this.perspective = new Perspective()
  }

  public toJSON(): {
    [K in keyof Omit<
      Player,
      KeysExtending<Player, (...args: any) => any> | `perspective`
    >]: Player[K]
  } {
    return {}
  }
}
export type PlayerParcel = Parcel<`Player`, Player>

export interface Card extends JsonApiResource {
  type: `Card`
  attributes: {
    rotation: number
  }
}

export interface CardGroup extends JsonApiResource {
  type: `CardGroup`
  attributes: {
    rotation: number
  }
}

export type GameEvent = {
  action: GameActions[GameActionKey]
  idPrev: string
}

export type GameState = {
  eventLog: GameEvent[]
  playerStatus: Record<string, string>
  players: Record<string, Player>
  cards: Record<string, ResourceAttributes<Card>>
  cardGroups: Record<string, ResourceAttributes<CardGroup>>
  cardValues: Record<string, { content: string }>
  cardsInGroups: Join<null, `cardId`, `groupId`>
  valuesOfCards: Join<null, `cardId`, `valueId`>
}

export type GameStore = StoreApi<GameState>

export const initGame = (): GameStore =>
  createStore<GameState>(() => ({
    eventLog: [],
    playerStatus: {},
    players: {},
    cards: {},
    cardGroups: {},
    cardValues: {},
    cardsInGroups: new Join(),
    valuesOfCards: new Join(),
  }))

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

export type GameActionPayload = {
  id: string
  options?: any
  targets?: Record<
    string,
    ResourceIdentifierObject<any> | ResourceIdentifierObject<any>[]
  >
}

export type GameActions = {
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
  ADD_CARD_GROUP: (payload: { id: string }) => Pick<GameState, `cardGroups`>
  MOVE_CARD: (payload: {
    id: string
    targets: {
      card: ResourceIdentifierObject<Card>
      group: ResourceIdentifierObject<CardGroup>
    }
  }) => Pick<GameState, `cardsInGroups`>
}

export const configureActions = (config: {
  idFn: () => string
}): ((store: GameStore) => { store: GameStore; actions: GameActions }) => {
  const useActions: ReturnType<typeof configureActions> = (store) => ({
    store,
    actions: {
      ADD_PLAYER: ({ options: { id } }) => ({
        players: {
          [id]: new Player(),
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
          valuesOfCards: store
            .getState()
            .valuesOfCards.set({ cardId: id, valueId: cardValue.id }),
        }
      },
      ADD_CARD_GROUP: () => {
        const id = config.idFn()
        return {
          cardGroups: {
            [id]: {
              rotation: 0,
            },
          },
        }
      },
      MOVE_CARD: ({ targets: { card, group } }) => ({
        cardsInGroups: store
          .getState()
          .cardsInGroups.set({ cardId: card.id, groupId: group.id }),
      }),
    },
  })
  return useActions
}
export const useActions = configureActions({ idFn: nanoid })

export const useDispatch = ({
  store,
  actions,
}: {
  store: GameStore
  actions: GameActions
}): {
  store: GameStore
  actions: GameActions
  dispatch: (
    action: GameActionKey,
    payload: GameActionPayload
  ) => Partial<GameState>
} => ({
  store,
  actions,
  dispatch: (key, payload) => {
    const delta = actions[key](payload as any)
    store.setState((state) => patch(state, delta as Fragment<GameState>))
    return delta
  },
})
