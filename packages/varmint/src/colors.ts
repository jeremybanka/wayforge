import { diffChars, diffLines, diffWords } from "diff"
import picocolors from "picocolors"
import type { Colors } from "picocolors/types"

export const pico: Colors = picocolors.createColors(true)
type Options = {
	showContext?: number // number of unchanged context lines to keep around changes; default: Infinity (show all)
	wordBoundary?: boolean // use word-aware diff or character diff; default: true
}

export function prettyPrintDiffInline(
	oldStr: string,
	newStr: string,
	opts: Options = {},
): string {
	const { showContext = Number.POSITIVE_INFINITY, wordBoundary = true } = opts
	const parts = diffLines(oldStr, newStr)

	// Helper: highlight word/char-level differences between two lines
	const highlightInline = (a: string, b: string) => {
		const segs = wordBoundary ? diffWords(a, b) : diffChars(a, b)

		// Build two parallel lines with highlighted spans
		let left = ``
		let right = ``

		for (const s of segs) {
			if (s.added) {
				// Appears only on the RIGHT side (new)
				right += pico.bgGreen(pico.black(s.value))
			} else if (s.removed) {
				// Appears only on the LEFT side (old)
				left += pico.bgRed(pico.black(s.value))
			} else {
				// Common text
				left += s.value
				right += s.value
			}
		}

		return {
			left: pico.red(`- ${left}`),
			right: pico.green(`+ ${right}`),
		}
	}

	// Compress unchanged context if requested
	const linesOut: string[] = []
	let buffer: string[] = []
	let pendingRemoved: string[] | null = null

	const flushBuffer = () => {
		if (!buffer.length) return
		if (buffer.length > showContext * 2 + 1) {
			const head = buffer.slice(0, showContext)
			const tail = buffer.slice(-showContext)
			linesOut.push(
				...head,
				pico.dim(
					`… ${buffer.length - head.length - tail.length} lines unchanged …`,
				),
				...tail,
			)
		} else {
			linesOut.push(...buffer)
		}
		buffer = []
	}

	for (const p of parts) {
		if (p.added) {
			// If we had a removed block before, pair them line-by-line
			const addedLines = p.value.split(`\n`)
			if (pendingRemoved) {
				const removedLines = pendingRemoved
				const m = Math.max(removedLines.length, addedLines.length)
				for (let j = 0; j < m; j++) {
					const oldLine = removedLines[j] ?? ``
					const newLine = addedLines[j] ?? ``
					const { left, right } = highlightInline(oldLine, newLine)
					flushBuffer()
					if (oldLine || newLine) {
						if (oldLine) linesOut.push(left)
						if (newLine) linesOut.push(right)
					}
				}
				pendingRemoved = null
			} else {
				// Pure addition block
				flushBuffer()
				for (const l of addedLines) if (l) linesOut.push(pico.green(`+ ${l}`))
			}
			continue
		}

		if (p.removed) {
			// Stash removed block and wait to see if next block is an added block
			pendingRemoved = p.value.split(`\n`)
			continue
		}

		// Unchanged chunk
		if (pendingRemoved) {
			// Removed with no following added → render as plain deletions
			flushBuffer()
			for (const l of pendingRemoved) if (l) linesOut.push(pico.red(`- ${l}`))
			pendingRemoved = null
		}
		// Accumulate unchanged lines for possible context collapsing
		const keep = p.value.split(`\n`)
		for (const l of keep) if (l) buffer.push(`  ${l}`)
	}

	// Tail cleanup
	if (pendingRemoved) {
		flushBuffer()
		for (const l of pendingRemoved) if (l) linesOut.push(pico.red(`- ${l}`))
	}
	flushBuffer()

	return linesOut.join(`\n`)
}
