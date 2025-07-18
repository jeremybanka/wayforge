export * from "./default-components"
export * from "./developer-interface"
export * from "./editors-by-type/utilities/cast-to-json"

export type SetterOrUpdater<T> = <New extends T>(
	next: New | ((old: T) => New),
) => void
