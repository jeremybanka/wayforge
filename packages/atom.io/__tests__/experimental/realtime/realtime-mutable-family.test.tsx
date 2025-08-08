import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { SetRTX } from "atom.io/transceivers/set-rtx"

const numberCollectionAtoms = AtomIO.mutableAtomFamily({
	key: `numbersCollection`,
	class: SetRTX<number>,
	effects: () => [
		({ setSelf }) => {
			setSelf((prev) => prev.add(0))
		},
	],
})
const numbersCollectionIndex = AtomIO.atom<Set<string>>({
	key: `numbersCollectionIndex`,
	default: new Set([`foo`]),
})
const addToNumbersCollectionTX = AtomIO.transaction<
	(collectionKey: string) => void
>({
	key: `addToNumbersCollection`,
	do: ({ set }, collectionKey) => {
		set(numberCollectionAtoms, collectionKey, (ns) => {
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
				const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
					socket,
					store,
				})
				const receiveTransaction = RTS.realtimeActionReceiver({ socket, store })
				exposeMutableFamily(numberCollectionAtoms, numbersCollectionIndex)
				receiveTransaction(addToNumbersCollectionTX)
			},
			clients: {
				dave: () => {
					const addToNumbersCollection = RTR.useServerAction(
						addToNumbersCollectionTX,
					)

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
					RTR.usePullMutableAtomFamilyMember(numberCollectionAtoms, `foo`)
					const numbers = AR.useJSON(numberCollectionAtoms, `foo`)
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
		await teardown()
	})
})
