import { isString } from "fp-ts/lib/string"

import type {
  Resource,
  ResourceIdentifierObject,
} from "~/packages/anvl/src/json-api"
import { isResourceIdentifier } from "~/packages/anvl/src/json-api"
import { Dictionary } from "~/packages/anvl/src/object/dictionary"
import { isLiteral } from "~/packages/anvl/src/refinement"

export const createPerspective = () =>
  new Dictionary({ from: `trueId`, into: `virtualId` })

export type VirtualIdentifier<R extends Resource> = ResourceIdentifierObject<
  R,
  string
>
export const isVirtualIdentifier = (
  thing: unknown
): thing is VirtualIdentifier<Resource> =>
  isResourceIdentifier.whoseMeta(isString)(thing)

export type TrueIdentifier<R extends Resource> = ResourceIdentifierObject<
  R,
  true
>
export const isTrueIdentifier = (
  thing: unknown
): thing is TrueIdentifier<Resource> =>
  isResourceIdentifier.whoseMeta(isLiteral(true))(thing)

export type Visibility = `hidden` | `private` | `public` | `secret`
