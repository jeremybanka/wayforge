export * from "./select-json"
export * from "./select-json-family"
export * from "~/packages/anvl/src/json"
export * from "~/packages/anvl/src/primitive"

import type { Json } from "~/packages/anvl/src/json"

export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void
