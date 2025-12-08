import { PassThrough } from "node:stream"

import type { Json } from "atom.io/json"
import { ChildSocket, ParentSocket } from "atom.io/realtime-server"
import { UList } from "atom.io/transceivers/u-list"

import * as Utils from "../../__util__"

console.log = () => undefined
console.info = () => undefined
console.warn = () => undefined
console.error = () => undefined
const logger: Pick<Console, `error` | `info` | `warn`> = console

interface VirtualProcess {
	stdin: PassThrough
	stdout: PassThrough
	stderr: PassThrough
	pid: number
}

let stdin: PassThrough
let stdout: PassThrough
let stderr: PassThrough
let parentToChild: ChildSocket<any, any, VirtualProcess>
let childToParent: ParentSocket<any, any, VirtualProcess & { exit: () => void }>
beforeEach(() => {
	vitest.spyOn(logger, `info`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `error`)
	vitest.spyOn(Utils, `stdout`)

	stdin = new PassThrough()
	stdout = new PassThrough()
	stderr = new PassThrough()
	const pid = 1

	parentToChild = new ChildSocket(
		{
			stdin,
			stdout,
			stderr,
			pid,
		},
		`child`,
	)

	childToParent = new ParentSocket({
		stdin,
		stdout,
		stderr,
		pid,
		exit: () => {
			logger.info(`exited`)
		},
	})
})

afterEach(() => {
	parentToChild?.proc.stdin.destroy()
	parentToChild?.proc.stdout.destroy()
	parentToChild?.proc.stderr.destroy()
})

describe(`socket interface`, () => {
	test(`ping-pong: can use 'emit' and 'on' to communicate between processes`, async () => {
		const gotPing = new Promise<string>((resolve) => {
			childToParent.on(`ping`, (msg: string) => {
				resolve(msg)
			})
		})

		parentToChild.emit(`ping`, `hello from parent`)

		const ping = await gotPing

		expect(ping).toBe(`hello from parent`)

		const gotPongA = new Promise<string>((resolve) => {
			parentToChild.on(`pong`, (msg: string) => {
				resolve(msg)
			})
		})
		const gotPongB = new Promise<string>((resolve) => {
			parentToChild.on(`pong`, (msg: string) => {
				resolve(msg)
			})
		})

		childToParent.emit(`pong`, `hello from child`)

		const pong = await Promise.all([gotPongA, gotPongB])

		expect(pong).toEqual([`hello from child`, `hello from child`])
	})
})

describe(`CustomSocket base class`, () => {
	test(`onAny and offAny work`, () => {
		const anyEvents: any[] = []
		const handler = (event: string, ...args: Json.Array) => {
			anyEvents.push([event, ...args])
		}
		childToParent.onAny(handler)
		parentToChild.emit(`foo`, 123)

		expect(anyEvents).toEqual([[`foo`, 123]])

		childToParent.offAny(handler)
		parentToChild.emit(`bar`, 456)

		expect(anyEvents.length).toBe(1)
	})

	test(`off works with and without listener`, () => {
		childToParent.on(`baz`, Utils.stdout)

		parentToChild.emit(`baz`, `value`)
		expect(Utils.stdout).toHaveBeenCalledWith(`value`)

		childToParent.off(`baz`, Utils.stdout)
		childToParent.emit(`baz`, `value`)
		expect(Utils.stdout).toHaveBeenCalledTimes(1)

		childToParent.off(`baz`)
	})
})

describe(`ChildSocket`, () => {
	test(`handles EPIPE error`, () => {
		const spy = vitest.spyOn(console, `error`)
		const origWrite = parentToChild.proc.stdin.write.bind(
			parentToChild.proc.stdin,
		)

		parentToChild.proc.stdin.write = (() => {
			parentToChild.proc.stdin.emit(`error`, { code: `EPIPE` })
			return false
		}) as any

		parentToChild.emit(`ping`, `test`)

		expect(spy).toHaveBeenCalledWith(
			`EPIPE error during write`,
			parentToChild.proc.stdin,
		)

		parentToChild.proc.stdin.write = origWrite
	})

	test(`handles incomplete data gracefully`, () => {
		parentToChild.on(`hi`, logger.info)
		parentToChild.on(`there`, logger.warn)
		parentToChild.on(`you`, logger.error)

		stdout.write(`["`)
		stdout.write(`["hi",{}]\x03`)
		stdout.write(`["there",{}]\x03["`)
		stdout.write(`you"`)
		stdout.write(`,{}]\x03`)

		expect(logger.info).toHaveBeenCalledWith({})
		expect(logger.warn).toHaveBeenCalledWith({})
		expect(logger.error).toHaveBeenCalledWith({})
	})
	test(`handles incomplete logs gracefully`, () => {
		stderr.write(`["`)
		stderr.write(`["i",{}]\x03`)
		stderr.write(`["w",{}]\x03["`)
		stderr.write(`e"`)
		stderr.write(`,{}]\x03`)

		expect(logger.info).toHaveBeenCalledWith(`1`, `child`, {})
		expect(logger.warn).toHaveBeenCalledWith(`1`, `child`, {})
		expect(logger.error).toHaveBeenCalledWith(`1`, `child`, {})
	})
})

describe(`ParentSocket`, () => {
	test(`handles incomplete data gracefully`, () => {
		childToParent.proc.stdin.write(`["hi",{}]\x03["there",{}]\x03["`)
		expect(logger.error).toHaveBeenCalled()
		childToParent.proc.stdin.write(`you"`)
		childToParent.proc.stdin.write(`,{}]\x03`)

		expect(logger.info).toHaveBeenCalledWith(`1`, `child`, `🎰`, `received`, [
			`hi`,
			{},
		])
		expect(logger.info).toHaveBeenCalledWith(`1`, `child`, `🎰`, `received`, [
			`there`,
			{},
		])
		expect(logger.info).toHaveBeenCalledWith(`1`, `child`, `🎰`, `received`, [
			`you`,
			{},
		])
	})

	test(`stderr logs get parsed and sent to logger`, () => {
		childToParent.logger.info(
			// @ts-expect-error 👺 Need custom logging serializer for IPC sockets
			new UList([1, 2, 3]),
		)
		childToParent.logger.warn(`warned`)
		childToParent.logger.error(`bad`)

		expect(logger.info).toHaveBeenCalledWith(`1`, `child`, `{ 1 | 2 | 3 }`)
		expect(logger.warn).toHaveBeenCalledWith(`1`, `child`, `warned`)
		expect(logger.error).toHaveBeenCalledWith(`1`, `child`, `bad`)
	})

	test(`logs JSON parse error`, () => {
		childToParent.proc.stdin.write(`{not-json}\x03`)
		expect(logger.error).toHaveBeenCalled()
	})

	test(`handles exit event`, () => {
		parentToChild.emit(`exit`)
		expect(logger.info).toHaveBeenCalledWith(`1`, `child`, `🎰`, `received`, [
			`exit`,
		])
		expect(logger.info).toHaveBeenCalledWith(`exited`)
	})

	test(`user joins and leaves`, async () => {
		childToParent.receiveRelay((userSocket) => {
			console.log(`relaying`, userSocket)
			userSocket.on(`ping`, () => {
				userSocket.emit(`pong`)
			})
			return () => {
				userSocket.off(`ping`)
			}
		})

		parentToChild.emit(`user-joins`, `user::alice`)
		expect([...childToParent[`relays`].keys()]).toContain(`user::alice`)

		const gotPong = new Promise<string>((resolve) => {
			parentToChild.on(`pong`, (msg: string) => {
				resolve(msg)
			})
		})

		parentToChild.emit(`user::alice`, `ping`)

		await gotPong

		parentToChild.emit(`user-leaves`, `alice`)
		expect([...childToParent[`relays`].keys()]).not.toContain(`alice`)
	})
})
