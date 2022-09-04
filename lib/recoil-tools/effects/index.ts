import type { Json } from "~/lib/json"

export type SerializationInterface<T> = {
  serialize: (t: T) => string
  deserialize: (s: string) => T
}

export type JsonInterface<T> = {
  toJson: (t: T) => Json
  fromJson: (json: Json) => T
}
