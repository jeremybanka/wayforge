import { a } from "eny/src"
import { immerable } from "immer"

import type { Privacy } from "./types"
import type { CardCycleId, CardId, PlayerId } from "../util/Id"
import { CardGroupId } from "../util/Id"
import { toggleBetween } from "../util/toggle"

export type CardGroupTypeName = `Deck` | `Hand` | `Pile` | `Trick`

const { shuffle } = a

export interface ICardGroupProps {
  id?: string
  cardIds?: CardId[]
  cardCycleId?: CardCycleId
  ownerId?: PlayerId
  rotated?: 0
  privacy?: Privacy
}

export abstract class CardGroup {
  public [immerable] = true

  public cardIds: CardId[]

  public cardCycleId: CardCycleId | null

  public class: string

  public id: CardGroupId

  public ownerId: PlayerId | null

  public privacy: Privacy

  public rotated: number

  public constructor({
    id,
    cardIds = [],
    cardCycleId,
    ownerId,
    rotated = 0,
  }: ICardGroupProps) {
    this.id = new CardGroupId(id)
    this.class = `CardGroup`
    this.cardIds = cardIds
    this.cardCycleId = cardCycleId || null
    this.privacy = `public`
    this.ownerId = ownerId || null
    this.rotated = rotated
  }

  public add(newCard: CardId, idx = 0): void {
    this.cardIds.splice(idx, 0, newCard)
  }
}

export class Deck extends CardGroup {
  public [immerable] = true

  public constructor(props: ICardGroupProps) {
    super(props)
    this.class = `Deck`
    this.privacy = `public`
  }

  public shuffle = (): void => (this.cardIds = shuffle(this.cardIds))

  public draw = (): CardId => {
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
  public class = `Pile`

  public constructor(props: ICardGroupProps) {
    super(props)
    this.privacy = props.privacy || `public`
  }

  public flip = (): Privacy =>
    (this.privacy = toggleBetween<Privacy>(`hidden`, `public`)(this.privacy))
}

export class Trick extends CardGroup {
  public class = `Trick`
}

export class Hand extends CardGroup {
  public constructor(props: ICardGroupProps) {
    super(props)
    this.class = `Hand`
    this.privacy = `secret`
  }
}
