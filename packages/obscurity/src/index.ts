import { isString } from "fp-ts/lib/string"

import { Stringified } from "~/packages/anvl/src/json"
import type {
  Resource,
  ResourceIdentifierObject,
} from "~/packages/anvl/src/json-api"
import { isResourceIdentifier } from "~/packages/anvl/src/json-api"
import { Dictionary } from "~/packages/anvl/src/object/dictionary"
import { isLiteral } from "~/packages/anvl/src/refinement"

export type Identifier<TypeName extends string> = {
  id: string
  type: TypeName
}

export interface TrueIdentifier<TypeName extends string>
  extends Identifier<TypeName> {
  reality: true
}
export interface VirtualIdentifier<TypeName extends string>
  extends Identifier<TypeName> {
  reality: false
}

export class Perspective extends Dictionary<
  string,
  string,
  `trueId`,
  `virtualId`
> {
  public constructor(base?: Record<string, string>) {
    super({ base, from: `trueId`, into: `virtualId` })
  }

  public virtualize<T extends string>(
    trueIdentifier: TrueIdentifier<T>
  ): VirtualIdentifier<T> {
    return {
      id: this.get(trueIdentifier.id),
      type: trueIdentifier.type,
      reality: false,
    }
  }

  public devirtualize<T extends string>(
    virtualIdentifier: VirtualIdentifier<T>
  ): TrueIdentifier<T> {
    return {
      id: this.get(virtualIdentifier.id),
      type: virtualIdentifier.type,
      reality: true,
    }
  }
}
