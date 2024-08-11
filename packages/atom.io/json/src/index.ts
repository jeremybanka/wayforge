import type { Json } from "~/packages/anvl/src/json"
import type { primitive } from "~/packages/anvl/src/primitive"

export * from "./select-json"
export * from "./select-json-family"

export type { Json, primitive }

export type Canonical = primitive | ReadonlyArray<Canonical>

export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void
