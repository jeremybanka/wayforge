import { cleanup, render } from "@testing-library/react"
import { useSingleEffect } from "atom.io/realtime-react"
import { vi } from "vitest"

// Helper to force global env mode
function setNodeEnv(value: `development` | `production`) {
	// @ts-expect-error – test override
	globalThis.env = { NODE_ENV: value }
}

// A simple test component that runs the hook
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
