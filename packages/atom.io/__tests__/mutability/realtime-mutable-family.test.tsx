import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import { IMPLICIT, type Store } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import * as React from "react"

function getFamily(
	family: AtomIO.MutableAtomFamily<any, any, any>,
	store: Store,
): AtomIO.MutableAtomFamily<any, any, any>
function getFamily(
	family: AtomIO.AtomFamily<any, any>,
	store: Store,
): AtomIO.AtomFamily<any, any>
function getFamily(
	family: AtomIO.SelectorFamily<any, any>,
	store: Store,
): AtomIO.SelectorFamily<any, any>
function getFamily(
	family: AtomIO.ReadonlySelectorFamily<any, any>,
	store: Store,
): AtomIO.ReadonlySelectorFamily<any, any>
function getFamily(family: any, store: Store): any {
	const storeFamily = store.families.get(family.key)
	return storeFamily
}
function useFamily(
	family: AtomIO.MutableAtomFamily<any, any, any>,
): AtomIO.MutableAtomFamily<any, any, any>
function useFamily(
	family: AtomIO.AtomFamily<any, any>,
): AtomIO.AtomFamily<any, any>
function useFamily(
	family: AtomIO.SelectorFamily<any, any>,
): AtomIO.SelectorFamily<any, any>
function useFamily(
	family: AtomIO.ReadonlySelectorFamily<any, any>,
): AtomIO.ReadonlySelectorFamily<any, any>
function useFamily(family: any): any {
	const store = React.useContext(AR.StoreContext)
	const storeFamily = getFamily(family, store)
	return storeFamily
}

const storeState = AtomIO.atom<Store>({
	key: `store`,
	default: IMPLICIT.STORE,
})

const findNumbersCollectionState = AtomIO.atomFamily<
	SetRTX<number>,
	SetRTXJson<number>,
	string
>({
	key: `numbersCollection`,
	mutable: true,
	default: () => new SetRTX<number>([0]),
	toJson: (s) => s.toJSON(),
	fromJson: (a) => SetRTX.fromJSON(a),
})
const numbersCollectionIndex = AtomIO.atom<Set<string>>({
	key: `numbersCollectionIndex`,
	default: new Set([`foo`]),
})
const addToNumbersCollectionTX = AtomIO.transaction<
	(collectionKey: string) => void
>({
	key: `addToNumbersCollection`,
	do: ({ get, set }, collectionKey) => {
		const store = get(storeState)
		const collectionFamily = getFamily(findNumbersCollectionState, store)
		set(collectionFamily(collectionKey), (ns) => {
			ns.add(ns.size)
			return ns
		})
	},
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store } }) => {
				socket.onAny((event, ...args) => {
					console.log(`🛰 `, event, ...args)
				})
				socket.onAnyOutgoing((event, ...args) => {
					console.log(`🛰  >>`, event, ...args)
				})
				AtomIO.setState(storeState, store, store)
				const exposeMutableFamily = RTS.useExposeMutableFamily({ socket, store })
				const receiveTransaction = RTS.useReceiveTransaction({ socket, store })
				const findNCState = getFamily(findNumbersCollectionState, store)
				exposeMutableFamily(findNCState, numbersCollectionIndex)
				receiveTransaction(addToNumbersCollectionTX)
			},
			clients: {
				dave: () => {
					const addToNumbersCollection = RTR.useServerAction(
						addToNumbersCollectionTX,
					)
					const store = React.useContext(AR.StoreContext)
					AtomIO.setState(storeState, store, store)
					const { socket } = React.useContext(RTR.RealtimeContext)
					socket.onAny((event, ...args) => {
						console.log(`📡  DAVE`, event, ...args)
					})
					socket.onAnyOutgoing((event, ...args) => {
						console.log(`📡  DAVE >>`, event, ...args)
					})
					return (
						<button
							type="button"
							onClick={() => {
								addToNumbersCollection(`foo`)
							}}
							data-testid={`addNumber`}
						/>
					)
				},
				jane: () => {
					const findNCState = useFamily(findNumbersCollectionState)
					RTR.usePullMutableFamilyMember(findNCState(`foo`))
					const numbers = AR.useJSON(findNCState(`foo`))
					const { socket } = React.useContext(RTR.RealtimeContext)
					socket.onAny((event, ...args) => {
						console.log(`📡 JANE`, event, ...args)
					})
					socket.onAnyOutgoing((event, ...args) => {
						console.log(`📡 JANE >>`, event, ...args)
					})
					return (
						<>
							{numbers.members.map((n) => (
								<i data-testid={n} key={n} />
							))}
						</>
					)
				},
			},
		})

	test.only(`client 1 -> server -> client 2`, async () => {
		const {
			clients: { jane, dave },
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)
		act(() => dave.renderResult.getByTestId(`addNumber`).click())
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})

	test(`client 2 disconnects/reconnects, gets update`, async () => {
		const {
			clients: { dave, jane },
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)

		jane.disconnect()

		act(() => dave.renderResult.getByTestId(`addNumber`).click())

		jane.renderResult.getByTestId(`0`)
		jane.reconnect()
		await waitFor(() => jane.renderResult.getByTestId(`1`))

		teardown()
	})
})
