import path from "path"
import { act } from "@testing-library/react"
import { actUponStore, findInStore, getFromStore } from "atom.io/internal"
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
				const userKeyRelState = findInStore(
					RTS.usersOfSockets.core.findRelatedKeysState,
					socket.id,
					store,
				)
				exposeMutable(userKeyRelState)
				const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({
					socket,
					store,
				})
				exposeMutableFamily(
					RTS.usersInRooms.core.findRelatedKeysState,
					RTS.userIndex,
				)
				socket.on(`create-room`, async (roomId) => {
					actUponStore(
						RTS.createRoomTX,
						Math.random().toString(36).slice(2),
						store,
					)(roomId, `bun`, [path.join(__dirname, `game-instance.bun.ts`)])
				})

				let forwardToRoom:
					| ((event: string, ...args: unknown[]) => void)
					| undefined
				const eventsForRoom = new Map<string, unknown[]>()
				socket.on(`join-room`, async (roomId) => {
					if (!userKey) {
						throw new Error(`User not found`)
					}
					forwardToRoom = (event: string, ...args: unknown[]) => {
						eventsForRoom.set(event, args)
					}
					actUponStore(
						RTS.joinRoomTX,
						Math.random().toString(36).slice(2),
						store,
					)(roomId, userKey, 0)

					const roomState = findInStore(RTS.roomSelectors, roomId, store)
					const room = await getFromStore(roomState, store)

					forwardToRoom = (event: string, ...args: unknown[]) => {
						room?.stdin.write([event, ...args].join(` `) + `\n`)
					}
					for (const [event, args] of eventsForRoom.entries()) {
						forwardToRoom(event, ...args)
					}

					room.stdout.on(`data`, (buf) => {
						const log = buf.toString()
						console.log(`[${roomId}] >>`, log)
						if (log.startsWith(`[`)) {
							console.log(`received data`, JSON.parse(log))
						}
					})

					room.stderr.on(`data`, (buf) => {
						const err = buf.toString()
						console.error(`[${roomId}] xx`, err)
					})

					room.on(`close`, (code) => {
						console.log(`${roomId} exited with code ${code}`)
						socket.emit(`room-close`, roomId, code)
					})
				})

				// store.loggers[0].logLevel = `info`
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
		const room = await app.renderResult.findByTestId(`room-1`)

		await new Promise((resolve) => setTimeout(resolve, 500))
		console.log(`tearing down`)
		teardown()
	})
})
