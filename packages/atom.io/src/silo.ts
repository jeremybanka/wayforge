import type { findState } from "atom.io/ephemeral"
import type { Transceiver } from "atom.io/internal"
import {
	createAtomFamily,
	createMoleculeFamily,
	createSelectorFamily,
	createStandaloneAtom,
	createStandaloneSelector,
	createTimeline,
	createTransaction,
	disposeFromStore,
	findInStore,
	getFromStore,
	makeMoleculeInStore,
	setIntoStore,
	Store,
	timeTravel,
} from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"

import type {
	AtomToken,
	disposeState,
	getState,
	makeMolecule,
	moleculeFamily,
	MutableAtomFamilyOptions,
	MutableAtomFamilyToken,
	MutableAtomOptions,
	MutableAtomToken,
	redo,
	RegularAtomFamilyOptions,
	RegularAtomFamilyToken,
	RegularAtomOptions,
	RegularAtomToken,
	setState,
	timeline,
	undo,
} from "."
import { subscribe } from "."
import type { atom, atomFamily } from "./atom"
import type { selector, selectorFamily } from "./selector"
import type { transaction } from "./transaction"

export class Silo {
	public store: Store
	public atom: typeof atom
	public atomFamily: typeof atomFamily
	public selector: typeof selector
	public selectorFamily: typeof selectorFamily
	public transaction: typeof transaction
	public timeline: typeof timeline
	public findState: typeof findState
	public getState: typeof getState
	public setState: typeof setState
	public disposeState: typeof disposeState
	public subscribe: typeof subscribe
	public undo: typeof undo
	public redo: typeof redo
	public moleculeFamily: typeof moleculeFamily
	public makeMolecule: typeof makeMolecule
	public constructor(config: Store[`config`], fromStore: Store | null = null) {
		const s = new Store(config, fromStore)
		function _atom<T>(options: RegularAtomOptions<T>): RegularAtomToken<T>
		function _atom<T extends Transceiver<any>, J extends Json.Serializable>(
			options: MutableAtomOptions<T, J>,
		): MutableAtomToken<T, J>
		function _atom<T>(
			options: MutableAtomOptions<any, any> | RegularAtomOptions<T>,
		): AtomToken<T> {
			return createStandaloneAtom(options, s)
		}
		function _atomFamily<
			T extends Transceiver<any>,
			J extends Json.Serializable,
			K extends Canonical,
		>(
			options: MutableAtomFamilyOptions<T, J, K>,
		): MutableAtomFamilyToken<T, J, K>
		function _atomFamily<T, K extends Canonical>(
			options: RegularAtomFamilyOptions<T, K>,
		): RegularAtomFamilyToken<T, K>
		function _atomFamily<T, K extends Canonical>(
			options:
				| MutableAtomFamilyOptions<any, any, any>
				| RegularAtomFamilyOptions<T, K>,
		): MutableAtomFamilyToken<any, any, any> | RegularAtomFamilyToken<T, K> {
			return createAtomFamily(options, s)
		}
		this.store = s
		this.atom = _atom
		this.atomFamily = _atomFamily
		this.selector = (options) => createStandaloneSelector(options, s) as any
		this.selectorFamily = (options) => createSelectorFamily(options, s) as any
		this.transaction = (options) => createTransaction(options, s)
		this.timeline = (options) => createTimeline(options, s)
		this.findState = ((...params: Parameters<typeof findState>) =>
			findInStore(s, ...params)) as typeof findState
		this.getState = ((...params: Parameters<typeof getState>) =>
			getFromStore(s, ...params)) as typeof getState
		this.setState = ((...params: Parameters<typeof setState>) => {
			setIntoStore(s, ...params)
		}) as typeof setState
		this.disposeState = ((...params: Parameters<typeof disposeState>) => {
			disposeFromStore(s, ...params)
		}) as typeof disposeState
		this.subscribe = (token, handler, key) => subscribe(token, handler, key, s)
		this.undo = (token) => {
			timeTravel(`undo`, token, s)
		}
		this.redo = (token) => {
			timeTravel(`redo`, token, s)
		}
		this.moleculeFamily = ((...params: Parameters<typeof moleculeFamily>) => {
			return createMoleculeFamily(...params, s)
		}) as any
		this.makeMolecule = ((...params: Parameters<typeof makeMolecule>) => {
			return makeMoleculeInStore(s, ...params)
		}) as any
	}
}
