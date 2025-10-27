import { useMemo, useRef, useState, useCallback } from "preact/hooks"

/**
 * BezierPlayground
 * A single-file React component that renders a cubic Bézier curve (P0—P3)
 * with draggable anchor points (P0, P3) and control handles (P1, P2).
 *
 * - Pure SVG; no external libs required
 * - Uses Pointer Events (mouse, pen, touch)
 * - setPointerCapture for smooth dragging
 * - Emits onChange with current points
 */

const WIDTH = 800
const HEIGHT = 500

const defaultPoints = {
	p0: { x: 120, y: 380 }, // start
	p1: { x: 220, y: 120 }, // control 1
	p2: { x: 520, y: 120 }, // control 2
	p3: { x: 680, y: 380 }, // end
}

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n))
}

function toPath({ p0, p1, p2, p3 }) {
	return `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`
}

function Handle({
	cx,
	cy,
	label,
	onPointerDown,
	fill = "white",
	stroke = "currentColor",
}) {
	const r = 8
	return (
		<g>
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill={fill}
				stroke={stroke}
				strokeWidth={2}
				onPointerDown={onPointerDown}
				style={{ cursor: "grab", touchAction: "none" }}
			/>
			<text
				x={cx + 12}
				y={cy - 12}
				fontSize={12}
				fill={stroke}
				pointerEvents="none"
			>
				{label}
			</text>
		</g>
	)
}

function BezierInspector({ points }) {
	const { p0, p1, p2, p3 } = points
	const code = useMemo(() => {
		const d = toPath(points)
		return (
			`// SVG path for the current curve\n` +
			`<path d="${d}" fill="none" stroke="#111" stroke-width="3" />`
		)
	}, [points])

	return (
		<div className="mt-4 grid gap-3 md:grid-cols-2">
			<div className="rounded-2xl border p-3 bg-white shadow-sm">
				<div className="text-sm font-semibold mb-2">Points</div>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<div>P0 (start)</div>
					<div>{`{ x: ${p0.x.toFixed(1)}, y: ${p0.y.toFixed(1)} }`}</div>
					<div>P1 (ctrl1)</div>
					<div>{`{ x: ${p1.x.toFixed(1)}, y: ${p1.y.toFixed(1)} }`}</div>
					<div>P2 (ctrl2)</div>
					<div>{`{ x: ${p2.x.toFixed(1)}, y: ${p2.y.toFixed(1)} }`}</div>
					<div>P3 (end)</div>
					<div>{`{ x: ${p3.x.toFixed(1)}, y: ${p3.y.toFixed(1)} }`}</div>
				</div>
			</div>
			<div className="rounded-2xl border p-3 bg-white shadow-sm">
				<div className="text-sm font-semibold mb-2">Path markup</div>
				<pre className="text-xs whitespace-pre-wrap leading-5">{code}</pre>
			</div>
		</div>
	)
}

export default function BezierPlayground({
	initial = defaultPoints,
	onChange,
}: {
	initial?: { p0: any; p1: any; p2: any; p3: any }
	onChange?: (points: { p0: any; p1: any; p2: any; p3: any }) => void
}) {
	const svgRef = useRef(null)
	const [points, setPoints] = useState(initial)
	const dragRef = useRef(null) // { key: 'p0'|'p1'|'p2'|'p3' }

	const setPoint = useCallback(
		(key, x, y) => {
			setPoints((prev) => {
				const next = {
					...prev,
					[key]: { x: clamp(x, 0, WIDTH), y: clamp(y, 0, HEIGHT) },
				}
				onChange?.(next)
				return next
			})
		},
		[onChange],
	)

	const getSVGCoords = useCallback((evt) => {
		const svg = svgRef.current
		const pt = svg.createSVGPoint()
		pt.x = evt.clientX
		pt.y = evt.clientY
		const ctm = svg.getScreenCTM().inverse()
		const { x, y } = pt.matrixTransform(ctm)
		return { x, y }
	}, [])

	const onPointerMove = useCallback(
		(evt) => {
			if (!dragRef.current) return
			evt.preventDefault()
			const { key } = dragRef.current
			const { x, y } = getSVGCoords(evt)
			setPoint(key, x, y)
		},
		[getSVGCoords, setPoint],
	)

	const onPointerUp = useCallback((evt) => {
		if (!dragRef.current) return
		evt.currentTarget.releasePointerCapture(evt.pointerId)
		dragRef.current = null
	}, [])

	const beginDrag = useCallback(
		(key) => (evt) => {
			dragRef.current = { key }
			evt.currentTarget.setPointerCapture(evt.pointerId)
		},
		[],
	)

	const pathD = useMemo(() => toPath(points), [points])

	const reset = useCallback(() => setPoints(defaultPoints), [])

	// Simple grid background
	const gridPattern = (
		<defs>
			<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
				<path
					d="M 20 0 L 0 0 0 20"
					fill="none"
					stroke="#e5e7eb"
					strokeWidth="1"
				/>
			</pattern>
			<pattern
				id="grid-lg"
				width="100"
				height="100"
				patternUnits="userSpaceOnUse"
			>
				<path
					d="M 100 0 L 0 0 0 100"
					fill="none"
					stroke="#d1d5db"
					strokeWidth="1.25"
				/>
			</pattern>
		</defs>
	)

	const { p0, p1, p2, p3 } = points

	return (
		<div className="w-full max-w-5xl mx-auto p-4">
			<div className="flex items-center justify-between mb-3">
				<h1 className="text-xl font-semibold">
					Cubic Bézier Curve — draggable SVG handles
				</h1>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={reset}
						className="px-3 py-1.5 rounded-xl border shadow-sm text-sm bg-white hover:bg-gray-50"
					>
						Reset
					</button>
					<a
						href="https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#bezier_curves"
						target="_blank"
						rel="noreferrer"
						className="px-3 py-1.5 rounded-xl border shadow-sm text-sm bg-white hover:bg-gray-50"
					>
						MDN: Bézier in SVG
					</a>
				</div>
			</div>

			<div className="rounded-2xl border overflow-hidden bg-white shadow-sm">
				<svg
					ref={svgRef}
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					width="100%"
					height="auto"
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
					style={{ touchAction: "none", background: "#fff" }}
				>
					<title>Bezier Playground</title>f{gridPattern}
					<rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#grid)" />
					<rect
						x="0"
						y="0"
						width={WIDTH}
						height={HEIGHT}
						fill="url(#grid-lg)"
						opacity={0.4}
					/>
					{/* Guide lines between anchors and controls */}
					<line
						x1={p0.x}
						y1={p0.y}
						x2={p1.x}
						y2={p1.y}
						stroke="#9ca3af"
						strokeDasharray="4 4"
					/>
					<line
						x1={p3.x}
						y1={p3.y}
						x2={p2.x}
						y2={p2.y}
						stroke="#9ca3af"
						strokeDasharray="4 4"
					/>
					{/* The Bezier path */}
					<path d={pathD} fill="none" stroke="#111827" strokeWidth={3} />
					{/* Anchor points (solid) */}
					<Handle
						cx={p0.x}
						cy={p0.y}
						label="P0"
						onPointerDown={beginDrag("p0")}
						fill="#111827"
						stroke="#111827"
					/>
					<Handle
						cx={p3.x}
						cy={p3.y}
						label="P3"
						onPointerDown={beginDrag("p3")}
						fill="#111827"
						stroke="#111827"
					/>
					{/* Control handles (hollow) */}
					<Handle
						cx={p1.x}
						cy={p1.y}
						label="P1"
						onPointerDown={beginDrag("p1")}
						fill="#ffffff"
						stroke="#ef4444"
					/>
					<Handle
						cx={p2.x}
						cy={p2.y}
						label="P2"
						onPointerDown={beginDrag("p2")}
						fill="#ffffff"
						stroke="#3b82f6"
					/>
				</svg>
			</div>

			<BezierInspector points={points} />

			<details className="mt-4">
				<summary className="cursor-pointer select-none font-medium">
					Usage
				</summary>
				<div className="mt-2 text-sm leading-6">
					<p>
						Import this component into your React app and render{" "}
						<code>&lt;BezierPlayground /&gt;</code>. Drag the anchors (P0/P3) and
						control points (P1/P2) to reshape the curve. The component uses
						Pointer Events so it works with mouse, pen, and touch.
					</p>
					<p className="mt-2">
						You can also pass an <code>initial</code> prop to set starting points
						and an <code>onChange</code> callback to receive updated coordinates
						on every drag.
					</p>
				</div>
			</details>
		</div>
	)
}
