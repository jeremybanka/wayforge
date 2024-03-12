import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import { IMPLICIT, type Store, setIntoStore } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import * as React from "react"
import { getFamily, useFamily } from "../../__util__/use-family"

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
			port: 2775,
			server: ({ socket, silo: { store } }) => {
				setIntoStore(storeState, store, store)
				const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
					socket,
					store,
				})
				const receiveTransaction = RTS.realtimeActionReceiver({ socket, store })
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
					setIntoStore(storeState, store, store)

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
					RTR.usePullMutableAtomFamilyMember(findNCState, `foo`)
					const numbers = AR.useJSON(findNCState(`foo`))
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
		const { clients, teardown } = scenario()

		const jane = clients.jane.init()
		const dave = clients.dave.init()

		jane.renderResult.getByTestId(`0`)
		act(() => {
			dave.renderResult.getByTestId(`addNumber`).click()
		})
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})
})
