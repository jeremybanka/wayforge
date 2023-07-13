import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import * as RTR from "atom.io/realtime-react"

import * as RTTest from "../__util__/realtime"

describe(`undo/redo`, () => {
	const countState = AtomIO.atom({ key: `count`, default: 0 })
	const countTL = AtomIO.timeline({ key: `countTL`, atoms: [countState] })
	const scenario = () =>
		RTTest.singleClient({
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RT.useExposeSingle({ socket, store })
				exposeSingle(countState)
			},
			client: () => {
				RTR.usePull(countState)
				const count = AR.useO(countState)
				return <i data-testid={`count:${count}`} />
			},
		})

	test(`server update; server undo; server redo`, async () => {
		const { client, server, teardown } = scenario()
		client.renderResult.getByTestId(`count:0`)
		act(() => server.silo.setState(countState, 1))
		await waitFor(() => client.renderResult.getByTestId(`count:1`))
		act(() => server.silo.undo(countTL))
		await waitFor(() => client.renderResult.getByTestId(`count:0`))
		act(() => server.silo.redo(countTL))
		await waitFor(() => client.renderResult.getByTestId(`count:1`))
		teardown()
	})
})
