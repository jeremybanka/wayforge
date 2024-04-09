import type * as net from "node:net"

class FakeOut implements Pick<net.Socket, `write`> {
	public captured: string[] = []

	public write(
		buffer: Uint8Array | string,
		cb?: ((err?: Error | undefined) => void) | undefined,
	): boolean
	public write(
		str: Uint8Array | string,
		encoding?: BufferEncoding | undefined,
		cb?: ((err?: Error | undefined) => void) | undefined,
	): boolean
	public write(
		output: Uint8Array | string,
		encodingOrCallback?:
			| BufferEncoding
			| ((err?: Error | undefined) => void)
			| undefined,
		callback?: ((err?: Error | undefined) => void) | undefined,
	): boolean {
		let err: Error | undefined
		const refinedCallback =
			typeof encodingOrCallback === `function` ? encodingOrCallback : callback
		try {
			if (typeof output === `string`) {
				this.captured.push(output)
			} else {
				const encoding =
					typeof encodingOrCallback === `string` ? encodingOrCallback : undefined
				const encoded = Buffer.from(output).toString(encoding)
				this.captured.push(encoded)
			}
		} catch (error) {
			if (error instanceof Error) {
				err = error
			}
		}
		refinedCallback?.(err)
		return true
	}
}

function encapsulateConsole(): {
	mockConsoleCalls: { [K in keyof typeof console]?: any[][] }
	restoreConsole: () => void
} {
	const createMockFn = () => {
		const calls: any[][] = []
		const mock = (...args: any[]) => calls.push([...args])
		return [mock, calls]
	}
	const originalConsoleMethods: Partial<typeof console> = {}
	const mockConsoleCalls: { [K in keyof typeof console]?: any[][] } = {}
	for (const [key, value] of Object.entries(console)) {
		if (typeof value === `function`) {
			originalConsoleMethods[key] = value.bind(console)
			const [mockFn, calls] = createMockFn()
			mockConsoleCalls[key] = calls
			console[key] = mockFn
		}
	}
	const restoreConsole = () => {
		for (const [key, value] of Object.entries(originalConsoleMethods)) {
			console[key] = value
		}
	}
	return { mockConsoleCalls, restoreConsole }
}
function withCapturedOutput<T>(
	fn: () => T,
	options: EncapsulationOptions = {
		console: true,
		stdout: true,
		stderr: true,
	},
): {
	returnValue: T
	capturedStdout: string[]
	capturedStderr: string[]
	mockConsoleCalls: { [K in keyof typeof console]?: any[][] }
	restoreOutputs: () => void
} {
	let originalStdoutWrite: typeof process.stdout.write | undefined
	let fakeStdout: FakeOut | undefined
	if (options.stdout) {
		originalStdoutWrite = process.stdout.write.bind(process.stdout)
		fakeStdout = new FakeOut()
		process.stdout.write = fakeStdout.write.bind(fakeStdout)
	}

	let originalStderrWrite: typeof process.stderr.write | undefined
	let fakeStderr: FakeOut | undefined
	if (options.stderr) {
		originalStderrWrite = process.stderr.write.bind(process.stderr)
		fakeStderr = new FakeOut()
		process.stderr.write = fakeStderr.write.bind(fakeStderr)
	}

	let restoreConsole: (() => void) | undefined
	let mockConsoleCalls: { [K in keyof typeof console]?: any[][] } | undefined
	if (options.console) {
		const consoleEncapsulation = encapsulateConsole()
		restoreConsole = consoleEncapsulation.restoreConsole
		mockConsoleCalls = consoleEncapsulation.mockConsoleCalls
	}

	const returnValue = fn()

	const restoreOutputs = () => {
		if (originalStdoutWrite) process.stdout.write = originalStdoutWrite
		if (originalStderrWrite) process.stderr.write = originalStderrWrite
		restoreConsole?.()
	}

	return {
		returnValue,
		capturedStdout: fakeStdout?.captured ?? [],
		capturedStderr: fakeStderr?.captured ?? [],
		mockConsoleCalls: mockConsoleCalls ?? {},
		restoreOutputs,
	}
}

export type EncapsulationOptions = {
	console?: boolean
	stdout?: boolean
	stderr?: boolean
}
export function encapsulate<T>(
	fn: () => T,
	options?: EncapsulationOptions,
): T extends Promise<infer U>
	? Promise<{
			returnValue: U
			capturedStdout: string[]
			capturedStderr: string[]
			mockConsoleCalls: { [K in keyof typeof console]?: any[][] }
		}>
	: {
			returnValue: T
			capturedStdout: string[]
			capturedStderr: string[]
			mockConsoleCalls: { [K in keyof typeof console]?: any[][] }
		} {
	const {
		returnValue,
		capturedStdout,
		capturedStderr,
		mockConsoleCalls,
		restoreOutputs,
	} = withCapturedOutput(fn, options)
	if (returnValue instanceof Promise) {
		const promise = returnValue.then((awaited) => {
			restoreOutputs()
			return {
				returnValue: awaited,
				capturedStdout,
				capturedStderr,
				mockConsoleCalls,
			}
		})
		return promise as any
	}
	restoreOutputs()
	return {
		returnValue,
		capturedStdout,
		capturedStderr,
		mockConsoleCalls,
	} as any
}
