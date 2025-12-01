import { cleanup, render } from "@testing-library/react"
import { useSingleEffect } from "atom.io/react"
import { RealtimeContext, useRealtimeService } from "atom.io/realtime-react"
import { useId } from "react"
import type { Socket } from "socket.io-client"
import { vi } from "vitest"

function setNodeEnv(value: `development` | `production`) {
	// @ts-expect-error – test override
	globalThis.env = { NODE_ENV: value }
}

function TestComponent({
	effect,
	deps,
}: {
	effect: () => (() => void) | void
	deps: unknown[]
}) {
	useSingleEffect(effect, deps)
	return <div data-testid="mounted" />
}

describe(`useSingleEffect`, () => {
	beforeEach(() => {
		cleanup()
	})

	it(`runs effect only once in development mode and cleans up correctly`, () => {
		setNodeEnv(`development`)
		const effect = vi.fn(() => {})

		const { rerender } = render(<TestComponent effect={effect} deps={[`a`]} />, {
			reactStrictMode: true,
		})

		expect(effect).toHaveBeenCalledTimes(1)

		rerender(<TestComponent effect={effect} deps={[`a`]} />)
		expect(effect).toHaveBeenCalledTimes(1)

		rerender(<TestComponent effect={effect} deps={[`b`]} />)
		expect(effect).toHaveBeenCalledTimes(2)
	})

	it(`runs effect only once in development mode (with cleanup)`, () => {
		setNodeEnv(`development`)
		const cleanupFn = vi.fn()
		const effect = vi.fn(() => {
			return cleanupFn
		})

		const { rerender } = render(<TestComponent effect={effect} deps={[`a`]} />, {
			reactStrictMode: true,
		})

		expect(effect).toHaveBeenCalledTimes(1)
		expect(cleanupFn).not.toHaveBeenCalled()

		rerender(<TestComponent effect={effect} deps={[`a`]} />)
		expect(effect).toHaveBeenCalledTimes(1)
		expect(cleanupFn).not.toHaveBeenCalled()

		rerender(<TestComponent effect={effect} deps={[`b`]} />)
		expect(cleanupFn).toHaveBeenCalledTimes(1)
		expect(effect).toHaveBeenCalledTimes(2)
	})

	it(`behaves like normal useEffect in production mode`, () => {
		setNodeEnv(`production`)
		const cleanupFn = vi.fn()
		const effect = vi.fn(() => cleanupFn)

		const { rerender, unmount } = render(
			<TestComponent effect={effect} deps={[`x`]} />,
		)

		expect(effect).toHaveBeenCalledTimes(1)

		rerender(<TestComponent effect={effect} deps={[`y`]} />)
		expect(cleanupFn).toHaveBeenCalledTimes(1)
		expect(effect).toHaveBeenCalledTimes(2)

		unmount()
		expect(cleanupFn).toHaveBeenCalledTimes(2)
	})
})

describe(`useRealtimeService`, () => {
	beforeEach(() => {
		cleanup()
	})

	const fakeSocket = {} as unknown as Socket

	const services = new Map<
		string,
		{ consumerCount: number; dispose: () => void }
	>()

	const setupService = vi.fn((id: string) => () => {
		console.log(`service: id`, id)
	})

	function ServiceConsumer() {
		const userId = useId()
		useRealtimeService(`a`, () => setupService(userId))

		return <div data-testid="mounted" />
	}

	test(`refcounting`, () => {
		setNodeEnv(`development`)

		render(
			<RealtimeContext.Provider value={{ socket: fakeSocket, services }}>
				<ServiceConsumer />
				<ServiceConsumer />
			</RealtimeContext.Provider>,
			{
				reactStrictMode: true,
			},
		)
		expect(setupService).toHaveBeenCalledTimes(1)
	})
})
