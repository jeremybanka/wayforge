import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"

import * as RTTest from "../__util__/realtime"

const countState = AtomIO.atom({ key: `count`, default: 0 })
const incrementTX = AtomIO.transaction({
	key: `increment`,
	do: ({ set }) => set(countState, (c) => c + 1),
})

describe(`running transactions`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RT.useExposeSingle({ socket, store })
				const receiveTransaction = RT.useReceiveTransaction({ socket, store })
				exposeSingle(countState)
				receiveTransaction(incrementTX)
			},
			clients: {
				dave: () => {
					const increment = RTR.useServerAction(incrementTX)
					return (
						<button
							type="button"
							onClick={() => increment()}
							data-testid={`increment`}
						/>
					)
				},
				jane: () => {
					RTR.usePull(countState)
					const count = AR.useO(countState)
					return <i data-testid={count} />
				},
			},
		})

	test(`client 1 -> server -> client 2`, async () => {
		const {
			clients: { jane, dave },
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)
		act(() => dave.renderResult.getByTestId(`increment`).click())
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

		act(() => dave.renderResult.getByTestId(`increment`).click())

		jane.renderResult.getByTestId(`0`)
		jane.reconnect()
		await waitFor(() => jane.renderResult.getByTestId(`1`))

		teardown()
	})

	test(`client 1 disconnects, makes update, reconnects`, async () => {
		const {
			clients: { dave, jane },
			teardown,
		} = scenario()
		jane.renderResult.getByTestId(`0`)

		dave.disconnect()
		act(() => dave.renderResult.getByTestId(`increment`).click())

		jane.renderResult.getByTestId(`0`)
		dave.reconnect()
		await waitFor(() => jane.renderResult.getByTestId(`1`))

		teardown()
	})
})
