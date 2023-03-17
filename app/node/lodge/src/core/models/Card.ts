import type { Privacy } from "./types"
import type { CardCycleId, CardValueId, PlayerId } from "../util/Id"
import { CardId } from "../util/Id"

export class Card {
  public id: CardId

  public class = `Card`

  public valueId: CardValueId

  public cycleId: CardCycleId | null

  public ownerId: PlayerId | null

  public privacy: Privacy

  public rotated: number

  public constructor(
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

  public straighten(): void {
    this.rotated = 0
  }

  public reveal(): void {
    this.privacy = `public`
  }

  public hide(): void {
    this.privacy = `hidden`
  }

  public seclude(): void {
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
