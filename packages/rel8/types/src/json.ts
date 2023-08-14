import type { JsonObj, Serializable, JsonArr } from "~/packages/anvl/src/json"
import { Primitive } from "~/packages/anvl/src/json"

export type Object = JsonObj
export type Array = JsonArr
export type Value = Serializable
export { Primitive }
