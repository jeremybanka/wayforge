import { act, waitFor } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

describe(`undo/redo`, () => {
	const countState = AtomIO.atom({ key: `count`, default: 0 })
	const countTL = AtomIO.timeline({ key: `countTL`, atoms: [countState] })
	const scenario = () =>
		RTTest.singleClient({
			port: 2855,
			server: ({ socket, silo: { store } }) => {
				const exposeSingle = RTS.realtimeStateProvider({ socket, store })
				exposeSingle(countState)
			},
			client: () => {
				RTR.usePullAtom(countState)
				const count = AR.useO(countState)
				return <i data-testid={`count:${count}`} />
			},
		})

	test(`server update; server undo; server redo`, async () => {
		const { client, server, teardown } = scenario()
		const app = client.init()
		app.renderResult.getByTestId(`count:0`)
		act(() => {
			server.silo.setState(countState, 1)
		})
		await waitFor(() => app.renderResult.getByTestId(`count:1`))
		act(() => {
			server.silo.undo(countTL)
		})
		await waitFor(() => app.renderResult.getByTestId(`count:0`))
		act(() => {
			server.silo.redo(countTL)
		})
		await waitFor(() => app.renderResult.getByTestId(`count:1`))
		teardown()
	})
})
