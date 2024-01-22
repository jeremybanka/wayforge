import path from "path"
import { act, waitFor } from "@testing-library/react"
import { actUponStore } from "atom.io"
import { type Store, findInStore, getFromStore } from "atom.io/internal"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { BrowserGame } from "./browser-game"
import { DatabaseManager } from "./database.node"

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

describe(`multi-process realtime server`, () => {
	const scenario = () => {
		const { server, client, teardown } = RTTest.singleClient({
			server: ({ socket, silo: { store } }) => {
				const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
				exposeMutable(RTS.roomIndex)
				socket.on(`create-room`, async (roomId) => {
					const room = await actUponStore(
						RTS.createRoomTX,
						Math.random().toString(36).slice(2),
						store,
					)(roomId, `bun`, [path.join(__dirname, `game.node.ts`)])
					room.stdout.on(`data`, (data) => {
						const parsed = JSON.parse(data.toString())
						console.log(`[${roomId}] >>`, parsed)
						socket.emit(`room-stdout`, roomId, parsed)
					})

					room.stderr.on(`data`, (data) => {
						const parsed = JSON.parse(data.toString())
						console.error(`[${roomId}] xx`, parsed)
						socket.emit(`room-stderr`, roomId, parsed)
					})

					room.on(`close`, (code) => {
						console.log(`${roomId} exited with code ${code}`)
						socket.emit(`room-close`, roomId, code)
					})

					socket.onAny((event, ...args) => {
						room.emit(event, ...args)
					})
				})
				const userKeyState = findInStore(
					RTS.usersOfSockets.states.userKeyOfSocket,
					socket.id,
					store,
				)
				const userKey = getFromStore(userKeyState, store)
				// store.loggers[0].logLevel = `info`
				socket.onAny((event, ...args) => {
					console.log(`🛰 `, userKey, event, ...args)
				})
				socket.onAnyOutgoing((event, ...args) => {
					console.log(`🛰  >>`, userKey, event, ...args)
				})
			},
			client: BrowserGame,
		})

		return { client, server, teardown }
	}

	it(`runs several instances of the same server`, async () => {
		const { client, server, teardown } = scenario()
		const app = client.init()
		const button = await app.renderResult.findByTestId(`create-room`)
		act(() => button.click())
		await waitFor(() => app.renderResult.getByTestId(`room-1`))

		await new Promise((resolve) => setTimeout(resolve, 3000))
		console.log(`tearing down`)
		teardown()
	})
})
