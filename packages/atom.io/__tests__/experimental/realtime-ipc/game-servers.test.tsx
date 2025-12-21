import { act } from "@testing-library/react"
import { roomMeta, ROOMS } from "atom.io/realtime-server"
import * as RTTest from "atom.io/realtime-testing"

import { BrowserGame } from "./BrowserGame"
import { DatabaseManager } from "./database.node"
import { SystemServer } from "./system-server.node"

/* ❗❗❗ turn off the lights when you're done ❗❗❗ */
// console.info = () => undefined
// console.log = () => undefined
// console.warn = () => undefined
// console.error = () => undefined
const dbManager = new DatabaseManager()

beforeAll(async () => {
	await dbManager.createDatabase()
})

beforeEach(async () => {
	roomMeta.count = 0
	console.log(`Creating sample tables`)
	await dbManager.createSampleTables()
	await dbManager.insertSampleData()
	await dbManager.setupTriggersAndNotifications()
})

afterEach(async () => {
	console.log(`KILLING ROOMS`, [...ROOMS.keys()])
	for (const [roomId, room] of ROOMS) {
		console.log(`KILLING ROOM ${roomId}`)
		room.proc.kill()
	}

	await dbManager.dropSampleTables()
})

afterAll(async () => {
	await dbManager.dropDatabase()
})

describe(`multi-process realtime server`, () => {
	const scenario = () => {
		const { server, client, teardown } = RTTest.singleClient({
			server: SystemServer,
			client: BrowserGame,
		})
		return { client, server, teardown }
	}

	it(`permits manual creation and deletion of rooms`, async () => {
		const { client, teardown } = scenario()
		const app = client.init()
		app.enableLogging()
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => {
			createRoomButton.click()
		})
		const deleteRoomButton =
			await app.renderResult.findByTestId(`delete-room::0`)
		act(() => {
			deleteRoomButton.click()
		})
		await app.renderResult.findByTestId(`no-rooms`)

		await teardown()
	})
	it(`permits join and leave`, async () => {
		const { client, teardown } = scenario()
		const app = client.init()
		app.enableLogging()
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => {
			createRoomButton.click()
		})
		const joinRoomButton = await app.renderResult.findByTestId(`join-room::0`)
		act(() => {
			joinRoomButton.click()
		})
		await app.renderResult.findByTestId(`room::0`)
		await app.renderResult.findByTestId(`A`, undefined, { timeout: 3000 })
		const leaveRoomButton = await app.renderResult.findByTestId(`leave-room`)
		act(() => {
			leaveRoomButton.click()
		})
		await app.renderResult.findByTestId(`create-room`)

		await teardown()
	})
	it(`reattaches to a room after disconnecting`, async () => {
		const { client, teardown } = scenario()
		const app = client.init()
		app.enableLogging()
		const createRoomButton = await app.renderResult.findByTestId(`create-room`)
		act(() => {
			createRoomButton.click()
		})
		const joinRoomButton = await app.renderResult.findByTestId(`join-room::0`)
		act(() => {
			joinRoomButton.click()
		})
		await app.renderResult.findByTestId(`room::0`)
		await app.renderResult.findByTestId(`A`, undefined, { timeout: 3000 })

		act(() => {
			app.socket.disconnect()
		})
		await app.renderResult.findByTestId(`disconnected`)

		act(() => {
			app.socket.connect()
		})
		await app.renderResult.findByTestId(`room::0`)
		await app.renderResult.findByTestId(`A`, undefined, { timeout: 3000 })

		const leaveRoomButton = await app.renderResult.findByTestId(`leave-room`)
		act(() => {
			leaveRoomButton.click()
		})
		await app.renderResult.findByTestId(`lobby`)

		await teardown()
	})
})
