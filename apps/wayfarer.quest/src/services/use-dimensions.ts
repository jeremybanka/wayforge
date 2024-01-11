import * as React from "react"

export function useDOMRect(): [React.RefObject<any>, DOMRectReadOnly | null] {
	const [rect, setRect] = React.useState<DOMRectReadOnly | null>(null)
	const ref = React.useRef(null)

	React.useEffect(() => {
		const observeTarget = ref.current
		const resizeObserver = new ResizeObserver(([entry]) => {
			setRect(entry.contentRect)
		})

		if (observeTarget) {
			resizeObserver.observe(observeTarget)
		}

		return () => {
			if (observeTarget) {
				resizeObserver.unobserve(observeTarget)
			}
		}
	}, [ref])

	return [ref, rect]
}
