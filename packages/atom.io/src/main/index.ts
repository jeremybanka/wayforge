export * from "./atom"
export * from "./dispose-state"
export type * from "./events"
export * from "./find-state"
export * from "./get-state"
export * from "./join"
export * from "./logger"
export * from "./realm"
export * from "./reset-state"
export * from "./selector"
export * from "./set-state"
export * from "./silo"
export * from "./subscribe"
export * from "./timeline"
export type * from "./tokens"
export * from "./transaction"
export * from "./validators"
/**
 * Loadable is used to type atoms or selectors that may at some point be initialized to or set to a {@link Promise}.
 *
 * When a Promise is cached as the value of a state in atom.io, that state will be automatically set to the resolved value of the Promise when it is resolved.
 *
 * As a result, we consider any state that can be a set to a Promise to be a "loadable" state, whose value may or may not be a Promise at any given time.
 */
export type Loadable<T> = Promise<T> | T

export type ViewOf<T> = T extends { READONLY_VIEW: infer View }
	? View
	: T extends Array<any>
		? readonly [...T]
		: T extends Set<infer U>
			? ReadonlySet<ViewOf<U>>
			: T extends Map<infer K, infer V>
				? ReadonlyMap<ViewOf<K>, ViewOf<V>>
				: T
