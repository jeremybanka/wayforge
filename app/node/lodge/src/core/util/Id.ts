import { nanoid } from "nanoid"

export const isNanoId = (x:string): boolean => new RegExp(/^[A-Za-z0-9_-]{0,21}$/).test(x)

export default class Id {
  private str: string

  constructor(str?: string) {
    this.str = str || nanoid()
  }

  toString = (): string => this.str

  isVirtual = false

  isAnon = false

  of = ``
}

export class TrueId extends Id {}
export class VirtualId extends Id { isVirtual = true }
export class AnonId extends VirtualId { isAnon = true }

export class CardId extends TrueId { of = `Card` }
export class CardCycleId extends TrueId { of = `CardCycle` }
export class CardGroupId extends TrueId { of = `CardGroup` }
export class CardValueId extends TrueId { of = `CardValue` }
export class GameId extends TrueId { of = `Game` }
export class PlayerId extends TrueId { of = `Player` }
export class ZoneId extends TrueId { of = `Zone` }
export class ZoneLayoutId extends TrueId { of = `ZoneLayout` }

export class VirtualCardId extends VirtualId { of = `Card` }
export class VirtualCardCycleId extends VirtualId { of = `CardCycle` }
export class VirtualCardGroupId extends VirtualId { of = `CardGroup` }
export class VirtualCardValueId extends VirtualId { of = `CardValue` }
export class VirtualGameId extends VirtualId { of = `Game` }
export class VirtualPlayerId extends VirtualId { of = `Player` }
export class VirtualZoneId extends VirtualId { of = `Zone` }
export class VirtualZoneLayoutId extends VirtualId { of = `ZoneLayout` }

export class AnonCardId extends AnonId { of = `Card` }
export class AnonCardGroupId extends AnonId { of = `Card` }
export class AnonCardCycleId extends AnonId { of = `Card` }

export const trueIdClassDict = {
  Card: CardId,
  CardCycle: CardCycleId,
  CardGroup: CardGroupId,
  CardValue: CardValueId,
  Game: GameId,
  Player: PlayerId,
  Zone: ZoneId,
  ZoneLayout: ZoneLayoutId,
}
export const virtualIdClassDict = {
  Card: VirtualCardId,
  CardCycle: VirtualCardCycleId,
  CardGroup: VirtualCardGroupId,
  CardValue: VirtualCardValueId,
  Game: VirtualGameId,
  Player: VirtualPlayerId,
  Zone: VirtualZoneId,
  ZoneLayout: VirtualZoneLayoutId,
}
export const anonClassDict = {
  Card: AnonCardId,
  CardCycle: AnonCardGroupId,
  CardGroup: AnonCardCycleId,
}

export interface IPreFrozenId {
  str: string
  of: string
  isVirtual: boolean
  isAnon: boolean
}

export const freezeId = (id: Id): string => {
  const { of, isVirtual, isAnon } = id
  const str = id.toString()
  const idObj: IPreFrozenId = { str, of, isVirtual, isAnon }
  return JSON.stringify(idObj)
}

export const thawId = (frozenId: string): Id => {
  const { str, of, isVirtual, isAnon }: IPreFrozenId = JSON.parse(frozenId)
  return isAnon
    ? new anonClassDict[of](str)
    : isVirtual
      ? new virtualIdClassDict[of](str)
      : new trueIdClassDict[of](str)
}
