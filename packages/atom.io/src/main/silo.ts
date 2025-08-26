import type { findState } from "atom.io"
import type { RootStore } from "atom.io/internal"
import {
	actUponStore,
	arbitrary,
	createMutableAtom,
	createMutableAtomFamily,
	createRegularAtom,
	createRegularAtomFamily,
	createSelectorFamily,
	createStandaloneSelector,
	createTimeline,
	createTransaction,
	disposeFromStore,
	findInStore,
	getFromStore,
	IMPLICIT,
	installIntoStore,
	resetInStore,
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
import type { atom, atomFamily, mutableAtom, mutableAtomFamily } from "./atom"
import type { resetState } from "./reset-state"
import type { selector, selectorFamily } from "./selector"
import type { runTransaction, transaction } from "./transaction"

export class Silo {
	public store: RootStore
	public atom: typeof atom
	public mutableAtom: typeof mutableAtom
	public atomFamily: typeof atomFamily
	public mutableAtomFamily: typeof mutableAtomFamily
	public selector: typeof selector
	public selectorFamily: typeof selectorFamily
	public transaction: typeof transaction
	public timeline: typeof timeline
	public findState: typeof findState
	public getState: typeof getState
	public setState: typeof setState
	public resetState: typeof resetState
	public disposeState: typeof disposeState
	public subscribe: typeof subscribe
	public undo: typeof undo
	public redo: typeof redo
	public runTransaction: typeof runTransaction
	public install: (tokens: AtomIOToken[], store?: RootStore) => void

	public constructor(config: Store[`config`], fromStore: Store | null = null) {
		const s = (this.store = new Store(config, fromStore) as RootStore)
		this.atom = ((options: Parameters<typeof atom>[0]) =>
			createRegularAtom(s, options, undefined)) as typeof atom
		this.mutableAtom = ((options: Parameters<typeof mutableAtom>[0]) =>
			createMutableAtom(s, options, undefined)) as typeof mutableAtom
		this.atomFamily = ((options: Parameters<typeof atomFamily>[0]) =>
			createRegularAtomFamily(s, options)) as typeof atomFamily
		this.mutableAtomFamily = ((
			options: Parameters<typeof mutableAtomFamily>[0],
		) => createMutableAtomFamily(s, options)) as typeof mutableAtomFamily
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
		this.resetState = ((...params: Parameters<typeof resetState>) => {
			resetInStore(s, ...params)
		}) as typeof resetState
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
