import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

const numbersCollectionState = AtomIO.mutableAtom<
	SetRTX<number>,
	SetRTXJson<number>
>({
	key: `numbersCollection`,
	default: () => new SetRTX<number>([0]),
	toJson: (s) => s.toJSON(),
	fromJson: (a) => SetRTX.fromJSON(a),
})
const addToNumbersCollectionTX = AtomIO.transaction({
	key: `addToNumbersCollection`,
	do: ({ set }) => {
		set(numbersCollectionState, (ns) => ns.add(ns.size))
	},
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			port: 5445,
			server: ({ socket, silo: { store } }) => {
				const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
				const receiveTransaction = RTS.realtimeActionReceiver({ socket, store })
				exposeMutable(numbersCollectionState)
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
							onClick={() => addToNumbersCollection()}
							data-testid={`addNumber`}
						/>
					)
				},
				jane: () => {
					RTR.usePullMutable(numbersCollectionState)
					const numbers = AR.useJSON(numbersCollectionState)
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

		act(() => {
			dave.renderResult.getByTestId(`addNumber`).click()
		})
		await waitFor(() => {
			jane.renderResult.getByTestId(`1`)
		})
		await teardown()
	})
})
