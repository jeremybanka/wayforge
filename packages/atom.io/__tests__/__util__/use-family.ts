import type * as AtomIO from "atom.io"
import { type Store } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as React from "react"

export function getFamily(
	family: AtomIO.MutableAtomFamily<any, any, any>,
	store: Store,
): AtomIO.MutableAtomFamily<any, any, any>
export function getFamily(
	family: AtomIO.AtomFamily<any, any>,
	store: Store,
): AtomIO.AtomFamily<any, any>
export function getFamily(
	family: AtomIO.SelectorFamily<any, any>,
	store: Store,
): AtomIO.SelectorFamily<any, any>
export function getFamily(
	family: AtomIO.ReadonlySelectorFamily<any, any>,
	store: Store,
): AtomIO.ReadonlySelectorFamily<any, any>
export function getFamily(
	family: AtomIO.ReadableFamily<any, any>,
	store: Store,
): AtomIO.ReadableFamily<any, any>
export function getFamily(
	family: AtomIO.ReadableFamily<any, any>,
	store: Store,
): AtomIO.ReadableFamily<any, any> | undefined {
	let storeFamily = store.families.get(family.key)
	if (storeFamily === undefined) {
		family.install(store)
		storeFamily = store.families.get(family.key)
	}
	return storeFamily
}
export function useFamily(
	family: AtomIO.MutableAtomFamily<any, any, any>,
): AtomIO.MutableAtomFamily<any, any, any>
export function useFamily(
	family: AtomIO.AtomFamily<any, any>,
): AtomIO.AtomFamily<any, any>
export function useFamily(
	family: AtomIO.SelectorFamily<any, any>,
): AtomIO.SelectorFamily<any, any>
export function useFamily(
	family: AtomIO.ReadonlySelectorFamily<any, any>,
): AtomIO.ReadonlySelectorFamily<any, any>
export function useFamily(family: AtomIO.ReadableFamily<any, any>): any {
	const store = React.useContext(AR.StoreContext)
	const storeFamily = getFamily(family, store)
	return storeFamily
}
