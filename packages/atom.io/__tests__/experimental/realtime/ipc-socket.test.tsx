import { PassThrough } from "node:stream"

import { ChildSocket, ParentSocket } from "atom.io/realtime-server"

const logger: Pick<Console, `error` | `info` | `warn`> = console

beforeEach(() => {
	vitest.spyOn(logger, `error`)
	vitest.spyOn(logger, `warn`)
	vitest.spyOn(logger, `info`)
})

test(`inter-process communication`, () => {
	const parentToChild = new PassThrough()
	const childToParent = new PassThrough()
	const childLogs = new PassThrough()
	const parentLogs = new PassThrough()

	const pid = 1

	const child = new ChildSocket(
		{
			stdin: parentToChild,
			stdout: childToParent,
			stderr: childLogs,
			pid,
			kill: () => true,
		},
		`child-socket`,
	)
	const parent = new ParentSocket({
		stdin: childToParent,
		stdout: parentToChild,
		stderr: parentLogs,
		pid,
	})
})
