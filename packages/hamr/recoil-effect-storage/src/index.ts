export type SerializationInterface<T> = {
	serialize: (t: T) => string
	deserialize: (s: string) => T
}

export * from "./local-storage"
