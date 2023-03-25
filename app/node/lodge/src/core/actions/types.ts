import type { Join } from "~/packages/anvl/src/join"
import type { JsonObj } from "~/packages/anvl/src/json"

import type { GameData } from "../../store/game"
import { GameSession } from "../../store/game"
import type { CardGroupTypeName } from "../models"
import type {
  CardGroupId,
  CardId,
  CardValueId,
  PlayerId,
  TrueId,
  VirtualId,
  ZoneId,
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

export type ActionType =
  | `CLEAR_TABLE`
  | `CREATE_CARD_CYCLE`
  | `CREATE_CARD_GROUP`
  | `CREATE_CARD_VALUES`
  | `CREATE_DECK`
  | `CREATE_HAND`
  | `CREATE_PILE`
  | `CREATE_PLAYER`
  | `CREATE_TRICK`
  | `CREATE_ZONE_LAYOUT`
  | `CREATE_ZONE`
  | `DEAL_ALL`
  | `DEAL`
  | `MOVE`
  | `PLACE`
  | `SHUFFLE`

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
export interface CoreGameActions
  extends Record<string, GameAction<CoreGameData>> {
  clearTable: () => Pick<
    GameData,
    | `cardGroupsById`
    | `cardGroupsById`
    | `cardsById`
    | `cardValuesById`
    | `zoneLayoutsById`
    | `zonesById`
  >
  createCardCycle: <PhaseNames extends string>(payload: {
    options: { phaseNames: ReadonlyArray<PhaseNames> }
    targets: { [NameOfPhase in PhaseNames]: CardGroupId | CardGroupId[] }
  }) => Pick<GameData, `cardCyclesById`>
  createCardGroup: (payload: {
    targets: { ownerId: PlayerId; cardValueIds: CardValueId[]; zoneId?: ZoneId }
    options: { type: CardGroupTypeName }
  }) => Pick<GameData, `cardGroupsById`>
  createCardValues: <CardData extends JsonObj>(payload: {
    options: { data: CardData[] }
  }) => Pick<GameData, `cardValuesById`>
  deal: (payload: {
    targets: { deckId: CardGroupId }
    options: { dealHowMany: number }
  }) => Pick<GameData, `cardGroupsById`>
  draw: (payload: {
    targets: { deckId: CardGroupId; handId: CardGroupId }
    options: { drawHowMany: number }
  }) => Pick<GameData, `cardGroupsById`>
}

export type RealTargets = Partial<Record<TargetType, TrueId | TrueId[]>>

export type VirtualTargets = Partial<Record<TargetType, VirtualId | VirtualId[]>>

export interface IVirtualActionRequest {
  type: ActionType
  targets?: VirtualTargets
  options?: Record<string, number | string>
}

export interface IActionRequestPayload {
  actorId?: PlayerId
  targets?: RealTargets
  options?: Record<string, any>
}

export interface IActionRequest {
  type: ActionType
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
  type: ActionType
  id: string
}
