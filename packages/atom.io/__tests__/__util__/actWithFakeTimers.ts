import { act } from "@testing-library/react"
import { vi } from "vitest"

async function flushTimers(ms = 0) {
	await vi.advanceTimersByTimeAsync(ms)
	vi.runAllTicks()
}

export async function actWithFakeTimers(fn: () => void): Promise<void> {
	vi.useFakeTimers()
	try {
		act(() => {
			fn()
		})
		await flushTimers(50)
	} finally {
		vi.useRealTimers()
	}
}
