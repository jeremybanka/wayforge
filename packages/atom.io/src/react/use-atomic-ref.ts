import type {
	AtomToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
} from "atom.io"
import {
	type CoalescedSubscriberData,
	createCoalescedSubscriber,
	findInStore,
	getFromStore,
	setIntoStore,
	type Store,
} from "atom.io/internal"
import type { Canonical } from "atom.io/json"
import { useContext } from "react"

import { StoreContext } from "./store-context"
import { useSingleEffect } from "./use-single-effect"

const ATOMIC_REF_CLEAR_COALESCE_MS = 20

const refSubscriptions: WeakMap<
	Store,
	WeakMap<object, CoalescedSubscriberData>
> = new WeakMap()
const activeRefElements: WeakMap<
	Store,
	WeakMap<object, Map<unknown, number>>
> = new WeakMap()
const lastPublishedRefElements: WeakMap<
	Store,
	WeakMap<object, unknown>
> = new WeakMap()

function getRefSubscriptions(
	store: Store,
): WeakMap<object, CoalescedSubscriberData> {
	let subscriptions = refSubscriptions.get(store)
	if (subscriptions === undefined) {
		subscriptions = new WeakMap()
		refSubscriptions.set(store, subscriptions)
	}
	return subscriptions
}

function getStoreElementMap(
	store: Store,
): WeakMap<object, Map<unknown, number>> {
	let storeElementMap = activeRefElements.get(store)
	if (storeElementMap === undefined) {
		storeElementMap = new WeakMap()
		activeRefElements.set(store, storeElementMap)
	}
	return storeElementMap
}

function getActiveElements(
	store: Store,
	token: AtomToken<unknown>,
): Map<unknown, number> {
	const storeElementMap = getStoreElementMap(store)
	let elements = storeElementMap.get(token)
	if (elements === undefined) {
		elements = new Map()
		storeElementMap.set(token, elements)
	}
	return elements
}

function getLastPublishedElements(store: Store): WeakMap<object, unknown> {
	let elements = lastPublishedRefElements.get(store)
	if (elements === undefined) {
		elements = new WeakMap()
		lastPublishedRefElements.set(store, elements)
	}
	return elements
}

function publishAtomicRef<T>(
	store: Store,
	token: AtomToken<T | null>,
	element: T,
): void {
	getLastPublishedElements(store).set(token, element)
	setIntoStore(store, token, element)
}

function getLastActiveElement(elements: Map<unknown, number>): unknown {
	let lastElement: unknown
	for (const element of elements.keys()) {
		lastElement = element
	}
	return lastElement
}

function addActiveElement(
	elements: Map<unknown, number>,
	element: unknown,
): void {
	elements.set(element, (elements.get(element) ?? 0) + 1)
}

function removeActiveElement(
	elements: Map<unknown, number>,
	element: unknown,
): void {
	const count = elements.get(element)
	if (count === undefined) {
		return
	}
	if (count === 1) {
		elements.delete(element)
	} else {
		elements.set(element, count - 1)
	}
}

function closeAtomicRef(store: Store, token: AtomToken<unknown>): void {
	const elements = getActiveElements(store, token)
	const activeElement = getLastActiveElement(elements)
	if (activeElement !== undefined) {
		publishAtomicRef(store, token, activeElement)
		return
	}
	const lastPublished = getLastPublishedElements(store).get(token)
	if (getFromStore(store, token) === lastPublished) {
		setIntoStore(store, token, null)
	}
	getLastPublishedElements(store).delete(token)
}

export function useAtomicRef<T, R extends { current: T | null }>(
	token: RegularAtomToken<T | null>,
	useRef: <TT>(initialValue: TT | null) => R,
): R

export function useAtomicRef<
	T,
	K extends Canonical,
	R extends { current: T | null },
>(
	token: RegularAtomFamilyToken<T | null, K>,
	key: NoInfer<K>,
	useRef: <TT>(initialValue: TT | null) => R,
): R

export function useAtomicRef<
	T,
	K extends Canonical,
	R extends { current: T | null },
>(
	...params:
		| [
				RegularAtomFamilyToken<T | null, K>,
				NoInfer<K>,
				<TT>(initialValue: TT | null) => R,
		  ]
		| [RegularAtomToken<T | null>, <TT>(initialValue: TT | null) => R]
): R {
	let token: AtomToken<T | null>
	let useRef: <TT>(initialValue: TT | null) => R
	const store = useContext(StoreContext)
	if (params.length === 3) {
		const family = params[0]
		const key = params[1]
		token = findInStore(store, family, key)
		useRef = params[2]
	} else {
		token = params[0]
		useRef = params[1]
	}
	const ref = useRef(null)

	useSingleEffect(() => {
		const element = ref.current
		if (element === null) {
			setIntoStore(store, token, null)
			return
		}
		const elements = getActiveElements(store, token)
		addActiveElement(elements, element)
		const unsubscribe = createCoalescedSubscriber(
			getRefSubscriptions(store),
			token,
			() => () => {
				closeAtomicRef(store, token)
			},
			ATOMIC_REF_CLEAR_COALESCE_MS,
		)
		publishAtomicRef(store, token, element)
		return () => {
			removeActiveElement(elements, element)
			if (getFromStore(store, token) === element) {
				const activeElement = getLastActiveElement(elements)
				if (activeElement !== undefined) {
					publishAtomicRef(store, token, activeElement as T)
				}
			}
			unsubscribe()
		}
	}, [token, ref.current])
	return ref
}
