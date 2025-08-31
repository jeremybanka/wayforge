import { PassThrough } from "node:stream"

import { ChildSocket, ParentSocket } from "atom.io/realtime-server"

const logger: Pick<Console, `error` | `info` | `warn`> = console

beforeEach(() => {
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

test(`inter-process communication`, async () => {
	const stdin = new PassThrough()
	const stdout = new PassThrough()
	const stderr = new PassThrough()
	const pid = 1

	const parentsInterfaceToChild = new ChildSocket(
		{
			stdin,
			stdout,
			stderr,
			pid,
			kill: () => true,
		},
		`child-socket`,
	)

	const childsInterfaceToParent = new ParentSocket({
		stdin,
		stdout,
		stderr,
		pid,
		exit: () => {
			console.log(`exited`)
		},
	})

	const gotPing = new Promise<[string]>((resolve) => {
		childsInterfaceToParent.on(`ping`, (msg: string) => {
			resolve([msg])
		})
	})

	parentsInterfaceToChild.emit(`ping`, `hello from parent`)

	const [ping] = await gotPing

	console.log(`⛔⛔⛔⛔⛔ gotPing`, ping)

	expect(ping).toBe(`hello from parent`)

	// and now test the reverse
	const gotPong = new Promise<[string]>((resolve) => {
		parentsInterfaceToChild.on(`pong`, (msg: string) => {
			resolve([msg])
		})
	})

	childsInterfaceToParent.emit(`pong`, `hello from child`)

	const [pong] = await gotPong

	console.log(`⛔⛔⛔⛔⛔ gotPing`, pong)

	expect(pong).toBe(`hello from child`)
})
