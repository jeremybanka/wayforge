import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"

import * as RTTest from "../../src/realtime-testing"

const countState = AtomIO.atom({ key: `count`, default: 0 })

describe(`pushing state`, () => {
	const scenario = () =>
		RTTest.multiClient({
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RT.useExposeSingle({ socket, store })
				const receiveState = RT.useReceiveState({ socket, store })
				exposeSingle(countState)
				receiveState(countState)
			},
			clients: {
				dave: () => {
					RTR.usePush(countState)
					const setCount = AR.useI(countState)
					return (
						<button
							type="button"
							onClick={() => setCount((c) => c + 1)}
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
})
