import type { Json } from "~/packages/anvl/src/json"

export type SerializationInterface<T> = {
  serialize: (t: T) => string
  deserialize: (s: string) => T
}

export type JsonInterface<T, J extends Json = Json> = {
  toJson: (t: T) => J
  fromJson: (json: J) => T
}
