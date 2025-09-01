import { PassThrough } from "node:stream"

import { ChildSocket, ParentSocket } from "atom.io/realtime-server"

const logger: Pick<Console, `error` | `info` | `warn`> = console

let parentToChild: ChildSocket<any, any>
let childToParent: ParentSocket<any, any>
beforeEach(() => {
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)

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
			console.log(`exited`)
		},
	})
})

afterEach(() => {
	parentToChild?.proc.stdin.destroy()
	parentToChild?.proc.stdout.destroy()
	parentToChild?.proc.stderr.destroy()
})

describe(`socket interface`, () => {
	test(`inter-process communication`, async () => {
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
