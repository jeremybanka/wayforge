import type { ƒn } from "atom.io"

// wrap a callback in performance.measure
export function time(key: string, callback: ƒn): PerformanceMeasure {
	performance.mark(`${key}-start`)
	callback()
	performance.mark(`${key}-end`)
	return performance.measure(key, `${key}-start`, `${key}-end`)
}
