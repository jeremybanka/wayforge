import { immerable } from "immer"

import type { PlayerId, ZoneId } from "../util/Id"
import { ZoneLayoutId } from "../util/Id"

interface IZoneLayoutProps {
  id?: string
  ownerId?: PlayerId
}

export class ZoneLayout {
  public [immerable] = true

  public id: ZoneLayoutId

  public ownerId: PlayerId | null

  public content: (ZoneId | ZoneLayoutId)[]

  public constructor({ id, ownerId }: IZoneLayoutProps) {
    this.id = new ZoneLayoutId(id)
    this.ownerId = ownerId || null
    this.content = []
  }
}
