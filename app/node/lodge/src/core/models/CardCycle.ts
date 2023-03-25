import type { CardGroupId, PlayerId, ZoneId } from "../util/Id"
import { CardCycleId } from "../util/Id"

export type TStatus = `Active` | `Dead` | `Dormant` | `Exiled` | `Ready`

export type TPhase =
  | CardGroupId
  | Map<PlayerId, CardGroupId>
  | Map<PlayerId, ZoneId>
  | ZoneId

interface ICardCycleProps {
  id?: string
  phases: (TPhase | TPhase[])[]
}

export class CardCycle {
  public id: CardCycleId

  public phases: (TPhase | TPhase[])[]

  public constructor({ id, phases }: ICardCycleProps) {
    this.id = new CardCycleId(id)
    this.phases = phases
  }
}
