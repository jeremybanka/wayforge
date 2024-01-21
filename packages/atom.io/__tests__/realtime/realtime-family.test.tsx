import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import { IMPLICIT, type Store } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"
import { getFamily, useFamily } from "../__util__/use-family"

const storeState = AtomIO.atom<Store>({
	key: `store`,
	default: IMPLICIT.STORE,
})

const findNumbersCollectionState = AtomIO.atomFamily<number[], string>({
	key: `numbersCollection`,
	default: [0],
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
			return [...ns, ns.length]
		})
	},
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store } }) => {
				AtomIO.setState(storeState, store, store)
				const exposeFamily = RTS.realtimeFamilyProvider({
					socket,
					store,
				})
				const receiveTransaction = RTS.realtimeActionReceiver({ socket, store })
				const findNCState = getFamily(findNumbersCollectionState, store)
				exposeFamily(findNCState, numbersCollectionIndex)
				receiveTransaction(addToNumbersCollectionTX)
			},
			clients: {
				dave: () => {
					const addToNumbersCollection = RTR.useServerAction(
						addToNumbersCollectionTX,
					)
					const store = React.useContext(AR.StoreContext)
					AtomIO.setState(storeState, store, store)

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
					RTR.usePullFamilyMember(findNCState(`foo`))
					const numbers = AR.useO(findNCState, `foo`)
					return (
						<>
							{numbers.map((n) => (
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
		act(() => dave.renderResult.getByTestId(`addNumber`).click())
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		teardown()
	})
})
