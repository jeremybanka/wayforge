import { atom, atomFamily, getState, setState } from "atom.io"
import { useO } from "atom.io/react"
import { PointerEvent, PointerEventHandler } from "preact/compat"
import { useRef, useCallback, useEffect, MutableRef } from "preact/hooks"

import { type RegularAtomToken } from "atom.io"

export default function BezierPlayground() {
	const svgRef = useAtomicRef(svgRefAtom)
	const onPointerUp: PointerEventHandler<SVGSVGElement> = useCallback((evt) => {
		evt.currentTarget.releasePointerCapture(evt.pointerId)
		setState(dragRefAtom, null)
	}, [])

	useEffect(reset, [])

	return (
		<div
			style={{
				display: "flex",
				flexFlow: "column",
				alignItems: "center",
			}}
		>
			<svg
				ref={svgRef}
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				width={WIDTH}
				height={HEIGHT}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				style={{
					display: "block",
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
				<PathsDemo />
			</svg>
			<button type="button" onClick={reset}>
				Reset
			</button>
		</div>
	)
}

export function useAtomicRef<T>(
	token: RegularAtomToken<T | null>,
): MutableRef<T | null> {
	const ref = useRef<T | null>(null)
	useEffect(() => {
		setState(token, ref.current)
	}, [token])
	return ref
}

const WIDTH = 800
const HEIGHT = 500

type PointXY = { x: number; y: number }

const pathKeysAtom = atom<string[]>({
	key: "pathKeys",
	default: [],
})
const subpathKeysAtoms = atomFamily<string[], string>({
	key: "subpathKeys",
	default: [],
})
const nodeAtoms = atomFamily<PointXY, string>({
	key: "nodeAtoms",
	default: { x: 0, y: 0 },
})
const edgeAtoms = atomFamily<null | { c?: PointXY; s: PointXY }, string>({
	key: "edgeAtoms",
	default: null,
})

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

function InteractiveNode({ subpathKey }: { subpathKey: string }) {
	const { x, y } = useO(nodeAtoms, subpathKey)
	return (
		<circle
			key={subpathKey}
			cx={x}
			cy={y}
			r={5}
			fill="red"
			onPointerDown={(evt) => {
				evt.currentTarget.setPointerCapture(evt.pointerId)
				setState(dragRefAtom, { key: subpathKey })
			}}
		/>
	)
}

function Subpath({ subpathKey, idx }: { subpathKey: string; idx?: number }) {
	const node = useO(nodeAtoms, subpathKey)
	const edge = useO(edgeAtoms, subpathKey)
	if (idx === 0) {
		return `M ${node.x} ${node.y}`
	}
	if (edge === null) {
		return `L ${node.x} ${node.y}`
	}
	if (`c` in edge) {
		return `C ${edge.c.x} ${edge.c.y} ${edge.s.x} ${edge.s.y} ${node.x} ${node.y} `
	}
	return `S ${edge.s.x} ${edge.s.y} ${node.x} ${node.y} `
}

function Path({ pathKey }: { pathKey: string }) {
	const subpathKeys = useO(subpathKeysAtoms, pathKey)

	return (
		<>
			<path
				d={`${subpathKeys.map((spk, idx) => Subpath({ subpathKey: spk, idx })).join(" ")} Z`}
				stroke="red"
			/>
			{subpathKeys.map((spk) => (
				<InteractiveNode subpathKey={spk} />
			))}
		</>
	)
}

function PathsDemo() {
	const pathKeys = useO(pathKeysAtom)
	return (
		<>
			{pathKeys.map((pathKey) => {
				return <Path pathKey={pathKey} />
			})}
		</>
	)
}

const gridPattern = (
	<defs>
		<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
			<circle cx="10" cy="10" r="0.5" fill="none" stroke="#aaa" />
		</pattern>
	</defs>
)

const svgRefAtom = atom<SVGSVGElement | null>({
	key: "svgRef",
	default: null,
})
const dragRefAtom = atom<null | { key: string }>({
	key: "dragRef",
	default: null,
})

function onPointerMove(evt: PointerEvent<SVGSVGElement>): void {
	evt.preventDefault()
	const { key } = getState(dragRefAtom) ?? {}
	const svg = getState(svgRefAtom)
	if (!svg || !key) {
		return
	}
	const pt = svg.createSVGPoint()
	pt.x = evt.clientX
	pt.y = evt.clientY
	const ctm = svg.getScreenCTM()?.inverse()
	const { x, y } = pt.matrixTransform(ctm)

	setState(nodeAtoms, key, { x: clamp(x, 0, WIDTH), y: clamp(y, 0, HEIGHT) })
}

const reset = () => {
	setState(nodeAtoms, "subpath0", { x: 110, y: 110 })
	setState(nodeAtoms, "subpath1", { x: 150, y: 150 })
	setState(subpathKeysAtoms, "path0", ["subpath0", "subpath1"])
	setState(pathKeysAtom, ["path0"])
}
