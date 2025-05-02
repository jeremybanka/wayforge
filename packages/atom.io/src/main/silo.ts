import type { findState } from "atom.io"
import {
	actUponStore,
	arbitrary,
	createAtomFamily,
	createSelectorFamily,
	createStandaloneAtom,
	createStandaloneSelector,
	createTimeline,
	createTransaction,
	disposeFromStore,
	findInStore,
	getFromStore,
	IMPLICIT,
	installIntoStore,
	setIntoStore,
	Store,
	subscribeInStore,
	timeTravel,
} from "atom.io/internal"

import type {
	AtomIOToken,
	disposeState,
	getState,
	redo,
	setState,
	subscribe,
	timeline,
	undo,
} from "."
import type { atom, atomFamily } from "./atom"
import type { selector, selectorFamily } from "./selector"
import type { runTransaction, transaction } from "./transaction"

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
	public runTransaction: typeof runTransaction
	public install: (tokens: AtomIOToken[], store?: Store) => void

	public constructor(config: Store[`config`], fromStore: Store | null = null) {
		const s = (this.store = new Store(config, fromStore))
		this.atom = ((options: Parameters<typeof atom>[0]) =>
			createStandaloneAtom(s, options)) as typeof atom
		this.atomFamily = ((options: Parameters<typeof atomFamily>[0]) =>
			createAtomFamily(s, options)) as typeof atomFamily
		this.selector = ((options: Parameters<typeof selector>[0]) =>
			createStandaloneSelector(s, options)) as typeof selector
		this.selectorFamily = ((options: Parameters<typeof selectorFamily>[0]) =>
			createSelectorFamily(s, options)) as typeof selectorFamily
		this.transaction = (options) => createTransaction(s, options)
		this.timeline = (options) => createTimeline(s, options)
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
		this.subscribe = ((...params: Parameters<typeof subscribe>) =>
			subscribeInStore(s, ...params)) as typeof subscribe
		this.undo = (token) => {
			timeTravel(s, `undo`, token)
		}
		this.redo = (token) => {
			timeTravel(s, `redo`, token)
		}
		this.runTransaction = (token, id = arbitrary()) => actUponStore(s, token, id)
		this.install = (tokens, source = IMPLICIT.STORE) => {
			installIntoStore(tokens, s, source)
		}
	}
}
