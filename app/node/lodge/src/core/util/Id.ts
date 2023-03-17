import { nanoid } from "nanoid"

export const isNanoId = (x: string): boolean =>
  new RegExp(/^[A-Za-z0-9_-]{0,21}$/).test(x)

export default abstract class Id {
  private str: string

  public constructor(str?: string) {
    this.str = str || nanoid()
  }

  public toString = (): string => this.str

  public isVirtual = false

  public isAnon = false

  public of: string
}

export abstract class TrueId extends Id {}
export abstract class VirtualId extends Id {
  public isVirtual = true as const
}
export abstract class AnonId extends VirtualId {
  public isAnon = true as const
}

export class CardId extends TrueId {
  public of = `Card` as const
}
export class CardCycleId extends TrueId {
  public of = `CardCycle` as const
}
export class CardGroupId extends TrueId {
  public of = `CardGroup` as const
}
export class CardValueId extends TrueId {
  public of = `CardValue` as const
}
export class GameId extends TrueId {
  public of = `Game` as const
}
export class PlayerId extends TrueId {
  public of = `Player` as const
}
export class ZoneId extends TrueId {
  public of = `Zone` as const
}
export class ZoneLayoutId extends TrueId {
  public of = `ZoneLayout` as const
}

export class VirtualCardId extends VirtualId {
  public of = `Card` as const
}
export class VirtualCardCycleId extends VirtualId {
  public of = `CardCycle` as const
}
export class VirtualCardGroupId extends VirtualId {
  public of = `CardGroup` as const
}
export class VirtualCardValueId extends VirtualId {
  public of = `CardValue` as const
}
export class VirtualGameId extends VirtualId {
  public of = `Game` as const
}
export class VirtualPlayerId extends VirtualId {
  public of = `Player` as const
}
export class VirtualZoneId extends VirtualId {
  public of = `Zone` as const
}
export class VirtualZoneLayoutId extends VirtualId {
  public of = `ZoneLayout` as const
}

export class AnonCardId extends AnonId {
  public of = `Card` as const
}
export class AnonCardGroupId extends AnonId {
  public of = `Card` as const
}
export class AnonCardCycleId extends AnonId {
  public of = `Card` as const
}

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
