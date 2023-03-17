import { immerable } from "immer"
import { a } from "eny/build/node"
import { CardCycleId, CardGroupId, CardId, PlayerId } from "../util/Id"
import { privacy } from "./types"
import toggle from "../util/toggle"

const { shuffle } = a

export interface ICardGroupProps {
  id?: string
  cardIds?: CardId[]
  cardCycleId?: CardCycleId
  ownerId?: PlayerId
  rotated?: 0
  privacy?: privacy
}

export class CardGroup {
  [immerable] = true

  cardIds: CardId[]

  cardCycleId: CardCycleId | null

  class: string

  id: CardGroupId

  ownerId: PlayerId | null

  privacy: privacy

  rotated: number

  constructor({
    id,
    cardIds = [],
    cardCycleId,
    ownerId,
    rotated = 0,
  }:ICardGroupProps) {
    this.id = new CardGroupId(id)
    this.class = `CardGroup`
    this.cardIds = cardIds
    this.cardCycleId = cardCycleId || null
    this.privacy = `public`
    this.ownerId = ownerId || null
    this.rotated = rotated
  }

  add(newCard: CardId, idx = 0): void {
    this.cardIds.splice(idx, 0, newCard)
  }
}

export class Deck extends CardGroup {
  [immerable] = true

  constructor(props: ICardGroupProps) {
    super(props)
    this.class = `Deck`
    this.privacy = `public`
  }

  shuffle = (): void => (this.cardIds = shuffle(this.cardIds))

  draw = (): CardId => {
    // console.log(this.cardIds.shift)
    // console.log(this.cardIds.slice(1).length)

    const drawnCard = this.cardIds[0]
    this.cardIds = this.cardIds.slice(1)
    // console.log(`drawnCard`, drawnCard)
    if (!drawnCard) throw new Error(`deck is empty`)
    return drawnCard
  }
}

export class Pile extends CardGroup {
  class = `Pile`

  constructor(props:ICardGroupProps) {
    super(props)
    this.privacy = props.privacy || `public`
  }

  flip = (): void => {
    this.privacy = toggle(this.privacy, `hidden`, `public`)
  }
}

export class Trick extends CardGroup { class = `Trick` }

export class Hand extends CardGroup {
  constructor(props:ICardGroupProps) {
    super(props)
    this.class = `Hand`
    this.privacy = `secret`
  }
}
