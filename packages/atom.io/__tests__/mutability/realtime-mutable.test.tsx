import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import * as React from "react"

const numbersCollectionState = AtomIO.atom({
	key: `numbersCollection`,
	mutable: true,
	default: () => new SetRTX<number>([0]),
	toJson: (s) => s.toJSON(),
	fromJson: (a) => SetRTX.fromJSON(a),
})
const addToNumbersCollectionTX = AtomIO.transaction({
	key: `addToNumbersCollection`,
	do: ({ set }) => set(numbersCollectionState, (ns) => ns.add(ns.size)),
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
				const exposeMutable = RTS.useExposeMutable({ socket, store })
				const receiveTransaction = RTS.useReceiveTransaction({ socket, store })
				exposeMutable(numbersCollectionState)
				receiveTransaction(addToNumbersCollectionTX)
			},
			clients: {
				dave: () => {
					const addToNumbersCollection = RTR.useServerAction(
						addToNumbersCollectionTX,
					)
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
							onClick={() => addToNumbersCollection()}
							data-testid={`addNumber`}
						/>
					)
				},
				jane: () => {
					RTR.usePullMutable(numbersCollectionState)
					const numbers = AR.useJSON(numbersCollectionState)
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
		// jane.renderResult.getByTestId(`0`)
		act(() => dave.renderResult.getByTestId(`addNumber`).click())
		// await new Promise((r) => setTimeout(r, 2000))
		await waitFor(() => {
			console.log(`retrieving...`)
			jane.renderResult.getByTestId(`1`)
		})
		teardown()
	})
})
