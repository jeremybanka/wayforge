import { immerable } from "immer"
import { PlayerId, ZoneId, ZoneLayoutId } from "../util/Id"

interface IZoneLayoutProps {
  id?: string
  ownerId?: PlayerId
}

export class ZoneLayout {
  [immerable] = true

  id: ZoneLayoutId

  ownerId: PlayerId | null

  content: (ZoneId|ZoneLayoutId)[]

  constructor({ id, ownerId }: IZoneLayoutProps) {
    this.id = new ZoneLayoutId(id)
    this.ownerId = ownerId || null
    this.content = []
  }
}
