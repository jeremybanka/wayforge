import { immerable } from "immer"

import type { Card } from "./Card"
import type { CardGroup, Deck, Pile, Trick } from "./CardGroup"
import type { CardGroupId, CardId, PlayerId } from "../util/Id"
import { ZoneId } from "../util/Id"

export interface IZoneProps {
  id?: string
  ownerId?: PlayerId
  contentType?: `Card` | `Deck` | `Pile` | `Trick` | null
  content?: Card | CardGroup
}

export class Zone {
  public [immerable] = true

  public id: ZoneId

  public ownerId: PlayerId | null

  public contentType: `Card` | `Deck` | `Pile` | `Trick` | null

  public content: CardGroupId | CardId | null

  public constructor({ id, ownerId, contentType, content }: IZoneProps) {
    // console.log(`ctor`, ownerId)
    this.id = new ZoneId(id)
    this.ownerId = ownerId || null
    this.contentType = contentType || null
    this.content = content?.id || null
  }

  public place = (entity: Card | Deck | Pile | Trick): void => {
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
