/* eslint-disable max-lines */

import { produce } from "immer"
import type { StoreApi } from "zustand/vanilla"
import create from "zustand/vanilla"

import type {
  ActionType,
  IAction,
  IActionRequest,
  IActionRequestPayload,
  IdType,
  RealTargets,
} from "../core/actions/types"
import type {
  Card,
  CardCycle,
  CardGroup,
  Player,
  Zone,
  ZoneLayout,
} from "../core/models"
import type { CardValue } from "../core/models/CardValue"
import type {
  CardCycleId,
  CardGroupId,
  CardId,
  CardValueId,
  PlayerId,
  TrueId,
  VirtualCardCycleId,
  VirtualCardGroupId,
  VirtualCardId,
  VirtualCardValueId,
  virtualIdClassDict,
  VirtualPlayerId,
  VirtualZoneId,
  VirtualZoneLayoutId,
  ZoneId,
  ZoneLayoutId,
} from "../core/util/Id"
import { GameId } from "../core/util/Id"
import mapObject from "../core/util/mapObject"

export type GameEntity =
  | Card
  | CardCycle
  | CardGroup
  | CardValue<unknown>
  | Player
  | Zone
  | ZoneLayout

export type GameEntityId =
  | CardCycleId
  | CardGroupId
  | CardId
  | CardValueId
  | PlayerId
  | ZoneId
  | ZoneLayoutId

export type VirtualGameEntityId =
  | VirtualCardCycleId
  | VirtualCardGroupId
  | VirtualCardId
  | VirtualCardValueId
  | VirtualPlayerId
  | VirtualZoneId
  | VirtualZoneLayoutId

export interface GameEntityIdSystem
  extends Record<
    GameEntityId[`of`],
    {
      entity: GameEntity
      id: { true: GameEntityId; virtual: VirtualGameEntityId }
    }
  > {
  Card: { entity: Card; id: { true: CardId; virtual: VirtualCardId } }
  CardCycle: {
    entity: CardCycle
    id: { true: CardCycleId; virtual: VirtualCardCycleId }
  }
  CardGroup: {
    entity: CardGroup
    id: { true: CardGroupId; virtual: VirtualCardGroupId }
  }
  CardValue: {
    entity: CardValue<unknown>
    id: { true: CardValueId; virtual: VirtualCardValueId }
  }
  Player: { entity: Player; id: { true: PlayerId; virtual: VirtualPlayerId } }
  Zone: { entity: Zone; id: { true: ZoneId; virtual: VirtualZoneId } }
  ZoneLayout: {
    entity: ZoneLayout
    id: { true: ZoneLayoutId; virtual: VirtualZoneLayoutId }
  }
}

const SLICE_NAMES_BY_TYPE: Record<string, keyof GameData> = {
  cardId: `cardsById`,
  cardCycleId: `cardCyclesById`,
  cardGroupId: `cardGroupsById`,
  cardValueId: `cardValuesById`,
  playerId: `playersById`,
  zoneId: `zonesById`,
  zoneLayoutId: `zoneLayoutsById`,
}

export interface GameData {
  cardsById: Record<string, Card>
  cardCyclesById: Record<string, CardCycle>
  cardGroupsById: Record<string, CardGroup>
  cardValuesById: Record<string, CardValue<unknown>>
  playersById: Record<string, Player>
  zonesById: Record<string, Zone>
  zoneLayoutsById: Record<string, ZoneLayout>
}

type Identify = <Id extends GameEntityId>(
  id: Id
) => GameEntityIdSystem[Id[`of`]][`entity`]

export interface GameSession extends GameData {
  id: GameId
  actions: Record<string, IAction>
  actionLog: IActionRequest[]
  playerIdsByUserId: Record<number, string>
  playerIdsBySocketId: Record<string, string>
  dispatch(actionRequest: IActionRequest): void
  every<T extends GameEntity>(type: IdType, fn: (entity: T) => boolean): TrueId[]
  forEach<T>(slice: keyof GameData, fn: (entity: T) => void): void
  getPlayers(): Player[]
  getSocketOwner(socketId: string): Player
  identify: Identify
  mapPlayers(fn: (player: Player) => void): Record<string, Player>
  mapEach(
    slice: keyof GameData,
    fn: (entity: GameEntity) => GameEntity
  ): Partial<Record<string, GameEntity>>
  match<T extends GameEntity>(
    type: IdType,
    pattern: string | ((entity: T) => boolean)
  ): TrueId
  merge(entities: GameEntity[]): {
    into: (sliceName: keyof GameData) => Partial<GameData>
  }
  registerSocket(socketId: string): { to: (player: Player) => void }
  run(type: ActionType, payload: IActionRequestPayload): void
  showPlayers(id: TrueId): void
  target(type: IdType, id: string): RealTargets
}

export const createGame = (): StoreApi<GameSession> =>
  create<GameSession>((set, get) => ({
    id: new GameId(),
    actions: {},
    actionLog: [],
    cardsById: {},
    cardCyclesById: {},
    cardGroupsById: {},
    cardValuesById: {},
    playersById: {},
    playerIdsByUserId: {},
    playerIdsBySocketId: {},
    zonesById: {},
    zoneLayoutsById: {},

    dispatch: (actionRequest) => {
      const { type, payload } = actionRequest
      const { actorId, targets, options } = payload
      const action = get().actions[type]

      //console.log(`action`, type, { ...payload, actorId: actorId?.toString() })

      try {
        const update = action.run({ actorId, targets, options })
        // console.log(`update`, update)
        set((state: GameSession) => {
          state = { ...state, ...update }
          // console.log(state)
          state.actionLog.push(actionRequest)
          const newPlayersById = { ...state.playersById }
          Object.values(newPlayersById).forEach((player) => {
            const newPlayer = produce(player, (draft) => {
              const imperative = draft.deriveImperative(actionRequest)
              draft.imperativeLog.push(imperative)
            })
            newPlayersById[player.id.toString()] = newPlayer
          })
          state.playersById = newPlayersById
          return state
        })
      } catch (error) {
        console.log(error)
        return error
      }
    },

    every<T extends GameEntity>(
      type: IdType,
      fn: (entity: T) => boolean
    ): TrueId[] {
      const sliceName = SLICE_NAMES_BY_TYPE[type]
      const ids: TrueId[] = []
      get().forEach<T>(sliceName, (entity) => {
        if (fn(entity) === true) ids.push(entity.id)
      })
      return ids
    },

    forEach(slice, fn) {
      const entities = Object.values(get()[slice])
      entities.forEach(fn)
    },

    getPlayers: () => Object.values(get().playersById),

    getSocketOwner: (socketId) =>
      get().playersById[get().playerIdsBySocketId[socketId]],

    identify<Id extends TrueId>(id: Id) {
      // console.log(id)
      const idString = id.toString()
      const g = get()
      const result = {
        Card: g.cardsById[idString],
        CardCycle: g.cardCyclesById[idString],
        CardGroup: g.cardGroupsById[idString],
        CardValue: g.cardValuesById[idString],
        Player: g.playersById[idString],
        Zone: g.zonesById[idString],
        ZoneLayout: g.zoneLayoutsById[idString],
      }[id.of]
      if (result) return result
      throw new Error(`id of unknown entity`)
    },

    mapEach: (slice: keyof GameData, fn: (entity: GameEntity) => GameEntity) =>
      mapObject<string, GameEntity, GameEntity>(get()[slice], (entity) =>
        produce(entity, fn)
      ),

    mapPlayers(fn) {
      const newPlayersById = { ...get().playersById }
      Object.values(newPlayersById).forEach((player) => {
        const newPlayer = produce(player, fn)
        newPlayersById[player.id.toString()] = newPlayer
      })
      return newPlayersById
    },

    match<T extends GameEntity>(type, pattern) {
      const sliceName = SLICE_NAMES_BY_TYPE[type]
      let id
      if (typeof pattern === `string`) {
        const slice = get()[sliceName]
        // console.log(`sliceName`, sliceName)
        // console.log(`pattern`, pattern)
        // console.log(get())
        id = slice[pattern].id
      }
      if (typeof pattern === `function`) {
        get().forEach<T>(sliceName, (entity) => {
          const matchFound = pattern(entity)
          if (matchFound) id = entity.id
        })
      }
      return id
    },

    merge: (entities) => ({
      into: (sliceName) => {
        const slice = get()[sliceName]
        const newEntitiesById: Partial<typeof slice> = {}
        entities.forEach((entity) => {
          newEntitiesById[entity.id.toString()] = entity
        })
        return {
          [sliceName]: {
            ...slice,
            ...newEntitiesById,
          },
        }
      },
    }),

    registerSocket: (socketId) => ({
      to: (player: Player) => {
        set((state) => {
          state.playerIdsBySocketId[socketId] = player.id.toString()
        })
      },
    }),

    run: (type, payload) => get().dispatch({ type, payload }),

    showPlayers(id) {
      set((state: GameSession) => {
        const newPlayers = get().mapPlayers((player) => player.show(id))
        state.playersById = newPlayers
      })
    },

    target: (type, id) => ({ [type]: get().match(type, id) }),
  }))
