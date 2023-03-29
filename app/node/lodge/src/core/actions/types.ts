import type { Join } from "~/packages/anvl/src/join"
import type { JsonObj } from "~/packages/anvl/src/json"

import type { GameData } from "../../store/game"
import type {
  CardCycle,
  CardGroup,
  CardGroupTypeName,
  CardValue,
  Player,
  Zone,
  ZoneLayout,
} from "../models"
import type {
  CardGroupId,
  CardValueId,
  PlayerId,
  TrueId,
  VirtualId,
  ZoneId,
  ZoneLayoutId,
} from "../util/Id"

export type IdType =
  | `cardCycleId`
  | `cardGroupId`
  | `cardId`
  | `cardValueId`
  | `playerId`
  | `zoneId`
  | `zoneLayoutId`

export type TargetType =
  | IdType
  | number
  | `cardValueIds`
  | `deckId`
  | `destinationId`
  | `handId`
  | `originId`
  | `ownerId`

export type DomainType = `Deck` | `System`

export type OptionType = `id`

export type CoreGameData = {
  cardsInGroup: Join
  cardOrGroupInZone: Join
  zoneOrLayoutInLayout: Join
  cardsByPlayer: Join
  groupsByPlayer: Join
  cardCyclesById: Record<string, CardCycle>
  cardGroupsById: Record<string, CardGroup>
  cardValuesById: Record<string, CardValue<unknown>>
  playersById: Record<string, Player>
  zonesById: Record<string, Zone>
  zoneLayoutsById: Record<string, ZoneLayout>
}

export type GameAction<GameData extends CoreGameData> = (
  payload:
    | {
        options: Record<string, any>
        targets: Record<string, TrueId | TrueId[]>
      }
    | { options: Record<string, any> }
    | { targets: Record<string, TrueId | TrueId[]> }
) => Partial<GameData>

export const CORE_GAME_ACTION_TYPES = [
  `CLEAR_TABLE`,
  `CREATE_CARD_CYCLE`,
  `CREATE_CARD_GROUP`,
  `CREATE_CARD_VALUES`,
  `CREATE_PLAYER`,
  `CREATE_ZONE`,
  `CREATE_ZONE_LAYOUT`,
  `DEAL`,
  `DRAW`,
  `MOVE`,
  `MOVE_TO_ZONE`,
  `MOVE_TO_ZONE_LAYOUT`,
  `SHUFFLE`,
  `SHUFFLE_INTO`,
  `SHUFFLE_INTO_ZONE`,
  `SHUFFLE_INTO_ZONE_LAYOUT`,
] as const

export type CoreGameActionType = (typeof CORE_GAME_ACTION_TYPES)[number]

export interface CoreGameActionSystem
  extends Record<CoreGameActionType, GameAction<CoreGameData>> {
  CLEAR_TABLE: () => Pick<
    GameData,
    | `cardGroupsById`
    | `cardGroupsById`
    | `cardsById`
    | `cardValuesById`
    | `zoneLayoutsById`
    | `zonesById`
  >
  CREATE_CARD_CYCLE: <PhaseNames extends string>(payload: {
    options: { phaseNames: ReadonlyArray<PhaseNames> }
    targets: { [NameOfPhase in PhaseNames]: CardGroupId | CardGroupId[] }
  }) => Pick<GameData, `cardCyclesById`>
  CREATE_CARD_GROUP: (payload: {
    targets: { ownerId: PlayerId; cardValueIds: CardValueId[]; zoneId?: ZoneId }
    options: { type: CardGroupTypeName }
  }) => Pick<GameData, `cardGroupsById`>
  CREATE_DECK: (payload: {
    targets: { ownerId: PlayerId; cardValueIds: CardValueId[]; zoneId?: ZoneId }
    options: { type: CardGroupTypeName }
  }) => Pick<GameData, `cardGroupsById`>
  CREATE_CARD_VALUES: <CardData extends JsonObj>(payload: {
    options: { data: CardData[] }
  }) => Pick<GameData, `cardValuesById`>
  CREATE_PLAYER: (payload: {
    options: {
      userId: number
      socketId: string
    }
  }) => Pick<GameData, `playersById`>
  CREATE_ZONE: (payload: {
    targets: { zoneLayoutId: ZoneLayoutId; ownerId: PlayerId }
    options: { id: string; contentTypel }
  }) => Pick<GameData, `zonesById`>
  CREATE_ZONE_LAYOUT: (payload: {
    targets: { ownerId: PlayerId }
    options: { id: string }
  }) => Pick<GameData, `zoneLayoutsById`>

  DEAL: (payload: {
    targets: { deckId: CardGroupId }
    options: { dealHowMany: number }
  }) => Pick<GameData, `cardGroupsById`>
  DRAW: (payload: {
    targets: { deckId: CardGroupId; playerId: PlayerId }
    options: { drawHowMany: number }
  }) => Pick<GameData, `cardGroupsById`>

  MOVE: (payload: {
    targets: { originId: CardGroupId; destinationId: CardGroupId }
    options: { howMany: number; destinationIndex?: number }
  }) => Pick<GameData, `cardGroupsById`>
}

export type RealTargets = Partial<Record<TargetType, TrueId | TrueId[]>>

export type VirtualTargets = Partial<Record<TargetType, VirtualId | VirtualId[]>>

export interface IVirtualActionRequest {
  type: CoreGameActionType
  targets?: VirtualTargets
  options?: Record<string, number | string>
}

export interface IActionRequestPayload {
  actorId?: PlayerId
  targets?: RealTargets
  options?: Record<string, any>
}

export interface IActionRequest {
  type: string
  payload: IActionRequestPayload
}

export type IStateUpdate = Partial<GameData>

export type updateProducer = (payload: IActionRequestPayload) => IStateUpdate

export interface IAction {
  domain: DomainType
  run: updateProducer
}

export interface IVirtualImperative {
  actorId?: PlayerId
  targets?: VirtualTargets
  options?: Record<string, any>
  type: CoreGameActionType
  id: string
}
