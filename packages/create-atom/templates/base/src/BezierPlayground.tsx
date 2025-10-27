import { PointerEvent, PointerEventHandler } from "preact/compat"
import { useMemo, useRef, useState, useCallback } from "preact/hooks"

const WIDTH = 800
const HEIGHT = 500

type PointXY = { x: number; y: number }
const defaultPoints = {
	p0: { x: 130, y: 370 }, // start
	p1: { x: 230, y: 130 }, // control 1
	p2: { x: 530, y: 130 }, // control 2
	p3: { x: 670, y: 370 }, // end
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

function toPath({
	p0,
	p1,
	p2,
	p3,
}: {
	p0: PointXY
	p1: PointXY
	p2: PointXY
	p3: PointXY
}) {
	return `M ${p0.x},${p0.y} C ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`
}

type HandleProps = {
	cx: number
	cy: number
	label: string
	onPointerDown: PointerEventHandler<SVGCircleElement>
	fill?: string
	stroke?: string
}
function Handle({
	cx,
	cy,
	label,
	onPointerDown,
	fill = "white",
	stroke = "currentColor",
}: HandleProps) {
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

const gridPattern = (
	<defs>
		<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
			<circle cx="10" cy="10" r="0.5" fill="none" stroke="#aaa" />
		</pattern>
	</defs>
)

type BezierPlaygroundProps = {
	initial?: {
		p0: PointXY
		p1: PointXY
		p2: PointXY
		p3: PointXY
	}
	onChange?: (points: {
		p0: PointXY
		p1: PointXY
		p2: PointXY
		p3: PointXY
	}) => void
}
export default function BezierPlayground({
	initial = defaultPoints,
	onChange,
}: BezierPlaygroundProps) {
	const svgRef = useRef(null)
	const [points, setPoints] = useState(initial)
	const dragRef = useRef(null) // { key: 'p0'|'p1'|'p2'|'p3' }

	const setPoint = useCallback(
		(key: string, x: number, y: number) => {
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

	const getSVGCoords = useCallback(
		(evt: PointerEvent<SVGSVGElement>): PointXY => {
			const svg = svgRef.current
			const pt = svg.createSVGPoint()
			pt.x = evt.clientX
			pt.y = evt.clientY
			const ctm = svg.getScreenCTM().inverse()
			const { x, y } = pt.matrixTransform(ctm)
			return { x, y }
		},
		[],
	)

	const onPointerMove: PointerEventHandler<SVGSVGElement> = useCallback(
		(evt) => {
			if (!dragRef.current) return
			evt.preventDefault()
			const { key } = dragRef.current
			const { x, y } = getSVGCoords(evt)
			setPoint(key, x, y)
		},
		[getSVGCoords, setPoint],
	)

	const onPointerUp: PointerEventHandler<SVGSVGElement> = useCallback((evt) => {
		if (!dragRef.current) return
		evt.currentTarget.releasePointerCapture(evt.pointerId)
		dragRef.current = null
	}, [])

	const beginDrag = useCallback(
		(key: string): PointerEventHandler<SVGCircleElement> =>
			(evt) => {
				dragRef.current = { key }
				evt.currentTarget.setPointerCapture(evt.pointerId)
			},
		[],
	)

	const pathD = useMemo(() => toPath(points), [points])

	const reset = useCallback(() => setPoints(defaultPoints), [])

	const { p0, p1, p2, p3 } = points

	return (
		<div>
			<div>
				<svg
					ref={svgRef}
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					width={WIDTH}
					height={HEIGHT}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
					style={{
						touchAction: "none",
						background: "#fafafa",
						border: "1px solid #ccc",
						borderRadius: "12px",
					}}
				>
					<title>Bezier Playground</title>
					{gridPattern}
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
			<button type="button" onClick={reset}>
				Reset
			</button>
		</div>
	)
}
