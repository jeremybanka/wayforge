import type { findState } from "atom.io/ephemeral"
import type { Transceiver } from "atom.io/internal"
import {
	createAtomFamily,
	createSelectorFamily,
	createStandaloneAtom,
	createStandaloneSelector,
	createTimeline,
	createTransaction,
	findInStore,
	getFromStore,
	setIntoStore,
	Store,
	timeTravel,
} from "atom.io/internal"
import type { Json } from "atom.io/json"

import type {
	AtomToken,
	getState,
	MutableAtomFamily,
	MutableAtomFamilyOptions,
	MutableAtomOptions,
	MutableAtomToken,
	redo,
	RegularAtomFamily,
	RegularAtomFamilyOptions,
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
	public subscribe: typeof subscribe
	public undo: typeof undo
	public redo: typeof redo
	public constructor(name: string, fromStore: Store | null = null) {
		const s = new Store(name, fromStore)
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
			K extends Json.Serializable,
		>(options: MutableAtomFamilyOptions<T, J, K>): MutableAtomFamily<T, J, K>
		function _atomFamily<T, K extends Json.Serializable>(
			options: RegularAtomFamilyOptions<T, K>,
		): RegularAtomFamily<T, K>
		function _atomFamily<T, K extends Json.Serializable>(
			options:
				| MutableAtomFamilyOptions<any, any, any>
				| RegularAtomFamilyOptions<T, K>,
		): MutableAtomFamily<any, any, any> | RegularAtomFamily<T, K> {
			return createAtomFamily(options, s)
		}
		this.store = s
		this.atom = _atom
		this.atomFamily = _atomFamily
		this.selector = (options) => createStandaloneSelector(options, s) as any
		this.selectorFamily = (options) => createSelectorFamily(options, s) as any
		this.transaction = (options) => createTransaction(options, s)
		this.timeline = (options) => createTimeline(options, s)
		this.findState = (token, key) => findInStore(token, key, s) as any
		this.getState = (token) => getFromStore(token, s)
		this.setState = (token, newValue) => {
			setIntoStore(token, newValue, s)
		}
		this.subscribe = (token, handler, key) => subscribe(token, handler, key, s)
		this.undo = (token) => {
			timeTravel(`undo`, token, s)
		}
		this.redo = (token) => {
			timeTravel(`redo`, token, s)
		}
	}
}
