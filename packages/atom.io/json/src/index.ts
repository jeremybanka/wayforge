export * from "anvl/json"
export * from "anvl/primitive"

export * from "./select-json"
export * from "./select-json-family"

import type { Json } from "anvl/json"

export type JsonIO = (...params: Json.Serializable[]) => Json.Serializable | void
