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

function withCapturedOutput<T>(fn: () => T): {
	returnValue: T
	capturedStdout: string[]
	capturedStderr: string[]
} {
	const originalStdoutWrite = process.stdout.write.bind(process.stdout)
	const originalStderrWrite = process.stderr.write.bind(process.stderr)
	const fakeStdout = new FakeOut()
	const fakeStderr = new FakeOut()

	process.stdout.write = fakeStdout.write.bind(fakeStdout)
	process.stderr.write = fakeStderr.write.bind(fakeStderr)

	const returnValue = fn()

	process.stdout.write = originalStdoutWrite
	process.stderr.write = originalStderrWrite

	return {
		returnValue,
		capturedStdout: fakeStdout.captured,
		capturedStderr: fakeStderr.captured,
	}
}

export function encapsulate<T>(fn: () => T): T extends Promise<infer U>
	? Promise<{
			returnValue: U
			capturedStdout: string[]
			capturedStderr: string[]
		}>
	: {
			returnValue: T
			capturedStdout: string[]
			capturedStderr: string[]
		} {
	const { returnValue, capturedStdout, capturedStderr } = withCapturedOutput(fn)
	if (returnValue instanceof Promise) {
		const promise = returnValue.then((returnValue) => ({
			returnValue,
			capturedStdout,
			capturedStderr,
		}))
		return promise as any
	}
	return {
		returnValue,
		capturedStdout,
		capturedStderr,
	} as any
}
