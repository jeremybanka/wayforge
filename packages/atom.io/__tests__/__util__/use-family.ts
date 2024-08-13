import type * as AtomIO from "atom.io"
import * as Internal from "atom.io/internal"
import * as AR from "atom.io/react"
import * as React from "react"

export function getFamily<
	Family extends AtomIO.MutableAtomFamilyToken<any, any, any>,
>(family: Family, store: Internal.Store): Family
export function getFamily<
	Family extends AtomIO.RegularAtomFamilyToken<any, any>,
>(family: Family, store: Internal.Store): Family
export function getFamily<
	Family extends AtomIO.WritableSelectorFamilyToken<any, any>,
>(family: Family, store: Internal.Store): Family
export function getFamily<
	Family extends AtomIO.ReadonlySelectorFamilyToken<any, any>,
>(family: Family, store: Internal.Store): Family
export function getFamily<Family extends AtomIO.ReadableFamilyToken<any, any>>(
	family: Family,
	store: Internal.Store,
): Family
export function getFamily(
	family: AtomIO.ReadableFamilyToken<any, any>,
	store: Internal.Store,
): Internal.ReadableFamily<any, any> | undefined {
	let storeFamily = store.families.get(family.key)
	if (storeFamily === undefined) {
		const actualFamily = Internal.IMPLICIT.STORE.families.get(family.key)
		actualFamily?.install(store)
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
