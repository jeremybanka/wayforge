import { PassThrough } from "node:stream"

import type { Json } from "atom.io/json"
import { ChildSocket, ParentSocket } from "atom.io/realtime-server"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import * as Utils from "../../__util__"

const logger: Pick<Console, `error` | `info` | `warn`> = console

interface VirtualProcess {
	stdin: PassThrough
	stdout: PassThrough
	stderr: PassThrough
	pid: number
}

let parentToChild: ChildSocket<any, any, VirtualProcess>
let childToParent: ParentSocket<any, any, VirtualProcess & { exit: () => void }>
beforeEach(() => {
	vitest.spyOn(logger, `info`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `error`)
	vitest.spyOn(Utils, `stdout`)

	const stdin = new PassThrough()
	const stdout = new PassThrough()
	const stderr = new PassThrough()
	const pid = 1

	parentToChild = new ChildSocket(
		{
			stdin,
			stdout,
			stderr,
			pid,
		},
		`child-socket`,
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

		const gotPong = new Promise<string>((resolve) => {
			parentToChild.on(`pong`, (msg: string) => {
				resolve(msg)
			})
		})

		childToParent.emit(`pong`, `hello from child`)

		const pong = await gotPong

		expect(pong).toBe(`hello from child`)
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

		// Patch write to simulate EPIPE
		parentToChild.proc.stdin.write = (() => {
			parentToChild.proc.stdin.emit(`error`, { code: `EPIPE` })
			return false
		}) as any

		parentToChild.emit(`ping`, `test`)

		expect(spy).toHaveBeenCalledWith(
			`EPIPE error during write`,
			parentToChild.proc.stdin,
		)

		// restore
		parentToChild.proc.stdin.write = origWrite
	})
})

describe(`ParentSocket`, () => {
	test(`handles incomplete data gracefully`, () => {
		parentToChild.proc.stdin.write(`["hi",{}]\x03["there",{}]\x03["`)
		expect(logger.error).toHaveBeenCalled()
		console.log(`unprocessed`, parentToChild.unprocessedEvents)
		console.log(`incomplete`, parentToChild.incompleteData)
		parentToChild.proc.stdin.write(`you"`)
		parentToChild.proc.stdin.write(`,{}]\x03`)
	})

	test(`stderr logs get parsed and sent to logger`, () => {
		childToParent.logger.info(new SetRTX([1, 2, 3]))
		childToParent.logger.warn(`warned`)
		childToParent.logger.error(`bad`)

		expect(logger.info).toHaveBeenCalledWith(
			`1`,
			`child-socket`,
			`{ 1 | 2 | 3 }`,
		)
		expect(logger.warn).toHaveBeenCalledWith(`1`, `child-socket`, `warned`)
		expect(logger.error).toHaveBeenCalledWith(`1`, `child-socket`, `bad`)
	})

	test(`logs JSON parse error`, () => {
		childToParent.proc.stdin.write(`{not-json}\x03`)
		expect(logger.error).toHaveBeenCalled()
	})

	test(`handles exit event`, () => {
		parentToChild.emit(`exit`)
		expect(logger.info).toHaveBeenCalledWith(
			`1`,
			`child-socket`,
			`🎰`,
			`received`,
			[`exit`],
		)
		expect(logger.info).toHaveBeenCalledWith(`exited`)
	})

	test(`user joins and leaves`, async () => {
		childToParent.relay((userSocket) => {
			console.log(`relaying`, userSocket)
			userSocket.on(`ping`, () => {
				userSocket.emit(`pong`)
			})
			return () => {
				userSocket.off(`ping`)
			}
		})

		parentToChild.emit(`user-joins`, `alice`)
		expect([...childToParent[`relays`].keys()]).toContain(`alice`)

		const gotPong = new Promise<string>((resolve) => {
			parentToChild.on(`pong`, (msg: string) => {
				resolve(msg)
			})
		})

		parentToChild.emit(`user:alice`, `ping`)

		await gotPong

		parentToChild.emit(`user-leaves`, `alice`)
		expect([...childToParent[`relays`].keys()]).not.toContain(`alice`)
	})
})
