import { CardCycleId, CardId, CardValueId, PlayerId } from "../util/Id"
import { privacy } from "./types"

export class Card {
  id: CardId

  class = `Card`

  valueId: CardValueId

  cycleId: CardCycleId | null

  ownerId: PlayerId | null

  privacy: privacy

  rotated: number

  constructor(
    valueId: CardValueId,
    cycleId?: CardCycleId,
    ownerId?: PlayerId
  ) {
    this.id = new CardId()
    this.valueId = valueId
    this.cycleId = cycleId || null
    this.ownerId = ownerId || null
    this.privacy = `public`
    this.rotated = 0
  }

  straighten(): void {
    this.rotated = 0
  }

  reveal(): void {
    this.privacy = `public`
  }

  hide(): void {
    this.privacy = `hidden`
  }

  seclude(): void {
    this.privacy = `secret`
  }

  // recall(game: Game): void {
  //   if (this.ownedBy === null) return
  //   const owner = game.players.find(player => player.id === this.ownedBy)
  //   owner.present(this)
  // }

  // replace(game: Game): void {
  //   if (this.ownedBy === null) return
  //   const owner = game.players.find(player => player.id === this.ownedBy)
  //   const abode = owner.cycles.find(cycle => cycle.id === this.ownedBy)
  //   abode[this.livesIn].recollect(this)
  // }
}
