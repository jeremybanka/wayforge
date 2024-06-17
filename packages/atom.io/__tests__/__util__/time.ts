import type { Func } from "atom.io/internal"

// wrap a callback in performance.measure
export function time(key: string, callback: Func): PerformanceMeasure {
	performance.mark(`${key}-start`)
	callback()
	performance.mark(`${key}-end`)
	return performance.measure(key, `${key}-start`, `${key}-end`)
}
