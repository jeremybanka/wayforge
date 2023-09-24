import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as M from "atom.io/mutable"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"
import { TransceiverSet } from "~/packages/anvl/reactivity"

AtomIO.setLogLevel(`info`)

const numbersCollectionState = M.createMutableAtom({
	key: `numbersCollection::mutable`,
	default: () => new TransceiverSet<`${number}`>([`0`]),
	toJson: (s) => [...s],
	fromJson: (a) => new TransceiverSet(a),
})
const addToNumbersCollectionTX = AtomIO.transaction({
	key: `addToNumbersCollection`,
	do: ({ set }) => set(numbersCollectionState, (ns) => ns.add(`${ns.size}`)),
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
				const exposeMutable = RT.useExposeMutable({ socket, store })
				const receiveTransaction = RT.useReceiveTransaction({ socket, store })
				exposeMutable(numbersCollectionState)
				receiveTransaction(addToNumbersCollectionTX)
			},
			clients: {
				dave: () => {
					const addToNumbersCollection = RTR.useServerAction(
						addToNumbersCollectionTX,
					)
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
							onClick={() => addToNumbersCollection()}
							data-testid={`addNumber`}
						/>
					)
				},
				jane: () => {
					RTR.usePullMutable(numbersCollectionState)
					const numbers = AR.useO(numbersCollectionState)
					const { socket } = React.useContext(RTR.RealtimeContext)
					socket.onAny((event, ...args) => {
						console.log(`📡 JANE`, event, ...args)
					})
					socket.onAnyOutgoing((event, ...args) => {
						console.log(`📡 JANE >>`, event, ...args)
					})
					return (
						<>
							{[...numbers].map((n) => (
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

	test.only(`client 1 disconnects, makes update, reconnects`, async () => {
		const {
			clients: { dave, jane },
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)

		dave.disconnect()
		act(() => dave.renderResult.getByTestId(`addNumber`).click())

		jane.renderResult.getByTestId(`0`)
		dave.reconnect()
		await waitFor(() => jane.renderResult.getByTestId(`1`))

		teardown()
	})
})
