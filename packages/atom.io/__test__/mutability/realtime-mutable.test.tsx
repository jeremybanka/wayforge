import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import * as React from "react"

AtomIO.setLogLevel(`info`)

const numbersCollectionState = AtomIO.atom({
	key: `numbersCollection::mutable`,
	mutable: true,
	default: () => new SetRTX<`${number}`>([`0`]),
	toJson: (s) => [...s],
	fromJson: (a) => new SetRTX(a),
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

	test.skip(`client 1 disconnects, makes update, reconnects`, async () => {
		const {
			clients: { dave, jane },
			server,
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)

		dave.disconnect()
		act(() => dave.renderResult.getByTestId(`addNumber`).click())

		// jane.a.getByTestId(`0`)
		dave.reconnect()
		await waitFor(() => jane.renderResult.getByTestId(`1`))
		/*
		.catch((e) => {
			const OBSERVED_KEY = `numbersCollection::mutable`
			console.log(`IMPLICIT_STORE:MUTABLE_________________________`)
			console.log(IMPLICIT.STORE.valueMap.get(OBSERVED_KEY))
			console.log(IMPLICIT.STORE.atoms.get(OBSERVED_KEY))
			console.log(`IMPLICIT_STORE:IMMUTABLE_______________________`)
			console.log(IMPLICIT.STORE.valueMap.get(`*` + OBSERVED_KEY))
			console.log(IMPLICIT.STORE.atoms.get(`*` + OBSERVED_KEY))
			console.log(`JANE:MUTABLE_________________________`)
			console.log(jane.silo.store.valueMap.get(OBSERVED_KEY))
			console.log(jane.silo.store.atoms.get(OBSERVED_KEY))
			console.log(`JANE:IMMUTABLE_______________________`)
			console.log(jane.silo.store.valueMap.get(`*` + OBSERVED_KEY))
			console.log(jane.silo.store.atoms.get(`*` + OBSERVED_KEY))
			console.log(`DAVE:MUTABLE_________________________`)
			console.log(dave.silo.store.valueMap.get(OBSERVED_KEY))
			console.log(dave.silo.store.atoms.get(OBSERVED_KEY))
			console.log(`DAVE:IMMUTABLE_______________________`)
			console.log(dave.silo.store.valueMap.get(`*` + OBSERVED_KEY))
			console.log(dave.silo.store.atoms.get(`*` + OBSERVED_KEY))
			console.log(`SERVER:MUTABLE_______________________`)
			console.log(server.silo.store.valueMap.get(OBSERVED_KEY))
			console.log(server.silo.store.atoms.get(OBSERVED_KEY))
			console.log(`SERVER:IMMUTABLE_____________________`)
			console.log(server.silo.store.valueMap.get(`*` + OBSERVED_KEY))
			console.log(server.silo.store.atoms.get(`*` + OBSERVED_KEY))
			console.log(`_____________________________`)
			throw e
		})
		*/

		teardown()
	})
})
