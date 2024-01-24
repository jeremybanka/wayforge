export * from "~/packages/anvl/src/json"
export * from "~/packages/anvl/src/primitive"

export * from "./select-json"
export * from "./select-json-family"

import type { Json } from "~/packages/anvl/src/json"

export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void
