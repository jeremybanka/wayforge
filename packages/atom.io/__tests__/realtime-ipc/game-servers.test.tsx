import path from "path"
import { act } from "@testing-library/react"
import {
	actUponStore,
	arbitrary,
	findInStore,
	getFromStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import * as RTS from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"
import { BrowserGame } from "./BrowserGame"
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
				const userKeyState = findInStore(
					RTS.usersOfSockets.states.userKeyOfSocket,
					socket.id,
					store,
				)
				const userKey = getFromStore(userKeyState, store)

				const exposeMutable = RTS.realtimeMutableProvider({ socket, store })
				exposeMutable(RTS.roomIndex)

				const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
					socket,
					store,
				})
				exposeMutableFamily(
					RTS.usersOfSockets.core.findRelatedKeysState,
					RTS.socketIndex,
				)
				exposeMutableFamily(
					RTS.usersInRooms.core.findRelatedKeysState,
					RTS.userIndex,
				)
				socket.on(`create-room`, async (roomId) => {
					actUponStore(RTS.createRoomTX, arbitrary(), store)(roomId, `bun`, [
						path.join(__dirname, `game-instance.bun.ts`),
					])
				})

				let forwardToRoom:
					| ((event: string, ...args: unknown[]) => void)
					| undefined
				const queuedEventsForRoom = new Map<string, unknown[]>()
				socket.on(`join-room`, async (roomId) => {
					if (!userKey) {
						throw new Error(`User not found`)
					}
					forwardToRoom = (event: string, ...args: unknown[]) => {
						queuedEventsForRoom.set(event, args)
					}
					actUponStore(RTS.joinRoomTX, arbitrary(), store)(roomId, userKey, 0)

					const roomState = findInStore(RTS.roomSelectors, roomId, store)
					const room = await getFromStore(roomState, store)
					const roomSocket = new RTS.ChildSocket(room)

					forwardToRoom = (event: string, ...args: Json.Array) => {
						roomSocket.emit(event, ...args)
					}
					for (const [event, args] of queuedEventsForRoom.entries()) {
						forwardToRoom(event, ...args)
					}
					queuedEventsForRoom.clear()

					roomSocket.onAny((...data) => socket.emit(...data))

					room.stderr.on(`data`, (buf) => {
						const err = buf.toString()
						console.error(`❌ [${roomId}]\n${err}`)
					})

					room.on(`close`, (code) => {
						console.log(`${roomId} exited with code ${code}`)
						socket.emit(`room-close`, roomId, code)
					})
				})

				socket.onAny((event, ...args) => {
					console.log(`🛰 `, userKey, event, ...args)
					forwardToRoom?.(event, ...args)
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
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => createRoomButton.click())
		const joinRoomButton = await app.renderResult.findByTestId(`join-room-1`)
		act(() => joinRoomButton.click())
		await app.renderResult.findByTestId(`room-1`)
		await app.renderResult.findByTestId(`A`)

		teardown()
	})
})
