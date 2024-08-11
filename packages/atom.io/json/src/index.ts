import type { Json, JsonInterface, stringified } from "~/packages/anvl/src/json"
import { parseJson, stringifyJson } from "~/packages/anvl/src/json"
import type { primitive } from "~/packages/anvl/src/primitive"

export * from "./select-json"
export * from "./select-json-family"

export type { Json, JsonInterface, primitive, stringified }
export { parseJson, stringifyJson }

export type Canonical = primitive | ReadonlyArray<Canonical>

export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void
