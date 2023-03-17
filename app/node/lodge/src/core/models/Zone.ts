import { immerable } from "immer"
import { CardGroupId, CardId, PlayerId, ZoneId } from "../util/Id"
import { Card } from "./Card"
import { CardGroup, Deck, Pile, Trick } from "./CardGroup"

export interface IZoneProps {
  id?: string
  ownerId?: PlayerId
  contentType?: null | `Card` | `Trick` | `Deck` | `Pile`
  content?: CardGroup | Card
}

export class Zone {
  [immerable] = true

  id: ZoneId

  ownerId: PlayerId | null

  contentType: null | `Card` | `Trick` | `Deck` | `Pile`

  content: null | CardId | CardGroupId

  constructor({ id, ownerId, contentType, content }: IZoneProps) {
    // console.log(`ctor`, ownerId)
    this.id = new ZoneId(id)
    this.ownerId = ownerId || null
    this.contentType = contentType || null
    this.content = content?.id || null
  }

  place = (entity:(Deck|Trick|Pile|Card)): void => {
    // console.log(entity)
    if (this.content) throw new Error(`zone is full`)
    if (this.contentType) {
      const entityClass = entity.class
      if (entityClass !== this.contentType) {
        throw new Error(`the placed entity does not match the contentType`)
      }
    }
    this.content = entity.id
  }
}
