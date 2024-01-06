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
import { getFamily, useFamily } from "../__util__/use-family"

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
				store.loggers[0].logLevel = `info`
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
					socket?.onAny((event, ...args) => {
						console.log(`📡  DAVE`, event, ...args)
					})
					socket?.onAnyOutgoing((event, ...args) => {
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
					socket?.onAny((event, ...args) => {
						console.log(`📡 JANE`, event, ...args)
					})
					socket?.onAnyOutgoing((event, ...args) => {
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

	test(`client 1 -> server -> client 2`, async () => {
		const {
			clients: { jane, dave },
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)
		act(() => dave.renderResult.getByTestId(`addNumber`).click())
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})
})
