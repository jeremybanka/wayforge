import colors from "colors"
import * as Diff from "diff"

export const logger: {
	info: Console[`info`]
	mark: ReturnType<typeof useMarks>[`mark`] | undefined
	logMarks: ReturnType<typeof useMarks>[`logMarks`] | undefined
} = {
	info(message: string, ...args: (number | string)[]): void {
		console.log(message, ...args)
	},
	mark: undefined,
	logMarks: undefined,
}

export function useMarks({ inline = false }: { inline?: boolean } = {}): {
	mark: (text: string) => void
	logMarks: () => void
} {
	const markers: PerformanceMark[] = []
	const logs: [event: string, duration: number][] = []
	function logMark(event: string, duration: number): void {
		const dur = duration.toFixed(2)
		const space = 80 - 2 - event.length - dur.length
		logger.info(event, `.`.repeat(space), dur)
	}

	function mark(text: string) {
		const prev = markers.at(-1)
		const next = performance.mark(text)
		if (prev) {
			const metric = performance.measure(
				`${prev.name} -> ${next.name}`,
				prev.name,
				next.name,
			)
			if (inline) {
				logMark(next.name, metric.duration)
			} else {
				logs.push([next.name, metric.duration])
			}
		}
		markers.push(next)
	}

	function logMarks(): void {
		const overall = performance.measure(
			`overall`,
			markers[0].name,
			markers[markers.length - 1].name,
		)
		if (!inline) {
			for (const [event, duration] of logs) {
				logMark(event, duration)
			}
		}
		logMark(`TOTAL TIME`, overall.duration)
		console.log()
	}
	return { mark, logMarks }
}

export function logDiff(
	mainGitRef: string,
	currentGitRef: string,
	mainCoverageTextReport: string,
	currentCoverageTextReport: string,
): void {
	logger.mark?.(`coverage diff between ${mainGitRef} and ${currentGitRef}:`)
	const coverageDiffLines = Diff.diffLines(
		mainCoverageTextReport,
		currentCoverageTextReport,
	)
	for (const chunk of coverageDiffLines) {
		const split = chunk.value.split(`\n`)
		const text = split
			.map((line, i) => {
				if (line.startsWith(`---`)) {
					return `--${line}`
				}
				if (line.startsWith(`File  `)) {
					return line.replace(`File`, `File  `)
				}
				if (i === split.length - 1) {
					return ``
				}
				if (chunk.added) {
					return colors.green(`+ ${line}`)
				}
				if (chunk.removed) {
					return colors.red(`- ${line}`)
				}
				return `  ${line}`
			})
			.join(`\n`)
		process.stdout.write(text)
	}
}
