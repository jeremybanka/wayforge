import path from "path"
import { act, waitFor } from "@testing-library/react"
import { actUponStore } from "atom.io"
import type { Store } from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import * as React from "react"
import { DatabaseManager } from "./database.node"

let mainServerStore: Store | undefined

const dbManager = new DatabaseManager()

beforeAll(async () => {
	await dbManager.createDatabase()
})

beforeEach(async () => {
	console.log(`Creating sample tables`)
	await dbManager.createSampleTables()
	await dbManager.insertSampleData()
	await dbManager.setupTriggersAndNotifications()
})

afterEach(async () => {
	await dbManager.dropSampleTables()
})

afterAll(async () => {
	await dbManager.dropDatabase()
})

describe(`multiple-instance`, () => {
	const scenario = () => {
		const { server, client, teardown } = RTTest.singleClient({
			server: ({ socket, silo: { store } }) => {
				mainServerStore = store
				const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
				exposeMutable(RTS.roomIndex)
				socket.on(`create-room`, async (roomId) => {
					const room = await actUponStore(
						RTS.createRoomTX,
						Math.random().toString(36).slice(2),
						store,
					)(roomId, `pnpm`, [`tsx`, path.join(__dirname, `game.node.ts`)])
					room.stdout.on(`data`, (data) => {
						console.log(`[${roomId}]`, data)
					})

					room.stderr.on(`data`, (data) => {
						console.error(`[${roomId}]`, data)
					})

					room.on(`close`, (code) => {
						console.log(`${roomId} exited with code ${code}`)
					})
				})
			},
			client: () => {
				RTR.usePullMutable(RTS.roomIndex)
				const roomIds = AR.useJSON(RTS.roomIndex)
				const { socket } = React.useContext(RTR.RealtimeContext)
				socket?.onAny((event, ...args) => {
					console.log(event, args)
				})

				return (
					<main>
						<ul>
							{roomIds.members.map((roomKey) => (
								<li key={roomKey} data-testid={roomKey}>
									{roomKey}
								</li>
							))}
						</ul>
						<button
							type="button"
							id="create-room"
							onClick={() => {
								if (socket) {
									socket.emit(`create-room`, `room-1`)
								} else {
									console.log(`socket is null`)
								}
							}}
						>
							Click me!
						</button>
					</main>
				)
			},
		})

		return { client, server, teardown }
	}

	it(`runs several instances of the same server`, async () => {
		const { client, server, teardown } = scenario()
		const app = client.init()
		const button = app.renderResult.getByRole(`button`)
		act(() => button.click())
		await waitFor(() => app.renderResult.getByTestId(`room-1`))

		await new Promise((resolve) => setTimeout(resolve, 500))
		teardown()
	})
})
