import type * as AtomIO from "atom.io"
import { type Store } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as React from "react"

export function getFamily<
	Family extends AtomIO.MutableAtomFamilyToken<any, any, any>,
>(family: Family, store: Store): Family
export function getFamily<
	Family extends AtomIO.RegularAtomFamilyToken<any, any>,
>(family: Family, store: Store): Family
export function getFamily<
	Family extends AtomIO.WritableSelectorFamilyToken<any, any>,
>(family: Family, store: Store): Family
export function getFamily<
	Family extends AtomIO.ReadonlySelectorFamilyToken<any, any>,
>(family: Family, store: Store): Family
export function getFamily<Family extends AtomIO.ReadableFamilyToken<any, any>>(
	family: Family,
	store: Store,
): Family
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
export function useFamily<
	Family extends AtomIO.MutableAtomFamilyToken<any, any, any>,
>(family: Family): Family
export function useFamily<
	Family extends AtomIO.RegularAtomFamilyToken<any, any>,
>(family: Family): Family
export function useFamily<
	Family extends AtomIO.WritableSelectorFamilyToken<any, any>,
>(family: Family): Family
export function useFamily<
	Family extends AtomIO.ReadonlySelectorFamilyToken<any, any>,
>(family: Family): Family
export function useFamily(family: AtomIO.ReadableFamilyToken<any, any>): any {
	const store = React.useContext(AR.StoreContext)
	const storeFamily = getFamily(family, store)
	return storeFamily
}
