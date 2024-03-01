import { Silo } from "atom.io"
import { roomIndex } from "atom.io/realtime"
import * as RTC from "atom.io/realtime-client"
import { setupRealtimeTestServer } from "atom.io/realtime-testing"
import { io } from "socket.io-client"

beforeAll(() => {
	const server = setupRealtimeTestServer({
		port: 3385,
		server: ({ socket, silo: { store } }) => {
			socket.on(`test`, () => {
				socket.emit(`test`, `test`)
			})
		},
	})
})

describe(`realtime rooms`, () => {
	test(`server`, async () => {
		const { store: roomAuditorStore } = new Silo(`room-auditor`)
		const socket = io(`http://localhost:3385`)
		RTC.pullMutableAtom(roomIndex, socket, roomAuditorStore)
		socket.emit(`create-room`, `room-1`)
		expect(roomAuditorStore.valueMap.get(roomIndex.key)).toEqual([`room-1`])
	})
})
