import type { GameData } from "../../store/game"
import { GameSession } from "../../store/game"
import type { PlayerId, TrueId, VirtualId } from "../util/Id"

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
  | `DRAW`
  | `MOVE`
  | `PLACE`
  | `SHUFFLE`

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
