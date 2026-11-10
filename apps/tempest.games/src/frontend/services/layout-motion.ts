import { onCleanup, onMount, useId, useStore } from "@atom.io/spa"
import type { RootStore } from "atom.io/internal"
import { animate } from "motion"

type Entry = { element: HTMLElement; stop: () => void }
type Layout = {
	entries: Map<string, Entry>
	boxes: Map<string, DOMRect>
	schedule: () => void
	dispose: () => void
}
const layouts = new WeakMap<RootStore, Layout>()

/** FLIP shared markers and phase containers with Motion's original layout timing. */
function createLayout(): Layout {
	const entries = new Map<string, Entry>()
	const boxes = new Map<string, DOMRect>()
	let frame = 0
	let queuedAt = 0
	const measure = () => {
		frame = 0
		const mounted = [...entries]
		const transforms = mounted.map(([, { element }]) => element.style.transform)
		for (const [, { element }] of mounted) element.style.transform = `none`
		const next = mounted.map(
			([key, { element }]) => [key, element.getBoundingClientRect()] as const,
		)
		mounted.forEach(([, { element }], i) => {
			element.style.transform = transforms[i]
		})
		for (const [key, box] of next) {
			const previous = boxes.get(key)
			boxes.set(key, box)
			if (
				!previous ||
				!box.width ||
				!box.height ||
				!previous.width ||
				!previous.height
			)
				continue
			const x = previous.x - box.x,
				y = previous.y - box.y
			const scaleX = previous.width / box.width,
				scaleY = previous.height / box.height
			if (
				Math.abs(x) + Math.abs(y) + Math.abs(scaleX - 1) + Math.abs(scaleY - 1) <
				0.01
			)
				continue
			const entry = entries.get(key)!
			entry.stop()
			if (window.matchMedia(`(prefers-reduced-motion: reduce)`).matches) continue
			entry.element.style.transformOrigin = `0 0`
			const animation = animate(0, 1, {
				duration: 0.45,
				ease: [0.4, 0, 0.1, 1],
				onUpdate: (progress) => {
					const remaining = 1 - progress
					entry.element.style.transform = `translate3d(${x * remaining}px, ${y * remaining}px, 0) scale(${1 + (scaleX - 1) * remaining}, ${1 + (scaleY - 1) * remaining})`
				},
			})
			animation.time = (performance.now() - queuedAt) / 1000
			entry.stop = () => {
				animation.stop()
			}
		}
	}
	const schedule = () => {
		if (!frame) {
			queuedAt = performance.now()
			frame = requestAnimationFrame(measure)
		}
	}
	const observer = new MutationObserver(schedule)
	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: [`data-css-current`],
	})
	window.addEventListener(`resize`, schedule)
	return {
		entries,
		boxes,
		schedule,
		dispose: () => {
			observer.disconnect()
			window.removeEventListener(`resize`, schedule)
			cancelAnimationFrame(frame)
		},
	}
}
export function useLayoutMotion(
	sharedId?: string,
): (element: HTMLElement | null) => void {
	const store = useStore()
	const id = sharedId ?? useId()
	let element: HTMLElement | null = null
	onMount(() => {
		let layout = layouts.get(store)
		if (!layout) {
			layout = createLayout()
			layouts.set(store, layout)
		}
		const entry: Entry = { element: element!, stop: () => {} }
		layout.entries.set(id, entry)
		layout.schedule()
		onCleanup(() => {
			if (layout.entries.get(id) === entry) {
				const box = entry.element.getBoundingClientRect()
				if (box.width && box.height) layout.boxes.set(id, box)
				layout.entries.delete(id)
			}
			entry.stop()
			if (!layout.entries.size) {
				layout.dispose()
				layouts.delete(store)
			}
		})
	})
	return (node) => {
		element = node
	}
}
