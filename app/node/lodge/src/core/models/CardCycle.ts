import { CardCycleId, CardGroupId, PlayerId, ZoneId } from "../util/Id"

export type TStatus =
  | `Dormant`
  | `Ready`
  | `Active`
  | `Dead`
  | `Exiled`

type TPhase =
  | CardGroupId
  | ZoneId
  | Map<PlayerId, CardGroupId>
  | Map<PlayerId, ZoneId>

interface ICardCycleProps {
  id?: string
  phases: TPhase[]
}

export class CardCycle {
 id:CardCycleId

 phases: TPhase[]

 constructor({ id, phases } : ICardCycleProps) {
   this.id = new CardCycleId(id)
   this.phases = phases
 }
}
