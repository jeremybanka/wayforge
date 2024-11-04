import type { Func } from "atom.io/internal"

// wrap a callback in performance.measure
export function time(key: string, callback: Func): PerformanceMeasure {
	performance.mark(`${key}-start`)
	callback()
	performance.mark(`${key}-end`)
	return performance.measure(key, `${key}-start`, `${key}-end`)
}

function useMarks(logger: Pick<Console, `info`> = console) {
	const markers: PerformanceMark[] = []
	function mark(text: string, ...logs: any[]) {
		const prev = markers.at(-1)
		const next = performance.mark(text)
		if (prev) {
			const metric = performance.measure(
				`${prev.name} -> ${next.name}`,
				prev.name,
				next.name,
			)
			logger.info(next.name, metric.duration, ...logs)
		}
		markers.push(next)
	}
	function logMarks(): void {
		const overall = performance.measure(
			`overall`,
			markers[0].name,
			markers[markers.length - 1].name,
		)
		logger.info(`TOTAL TIME`, overall.duration)
	}
	return { mark, logMarks }
}
export const { mark, logMarks } = useMarks()
