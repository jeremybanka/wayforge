import { atom, atomFamily, getState, setState } from "atom.io"
import { type RegularAtomToken } from "atom.io"
import { useO } from "atom.io/react"
import { PointerEvent, PointerEventHandler } from "preact/compat"
import { useRef, useCallback, useEffect, MutableRef } from "preact/hooks"

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
	const edge = useO(edgeAtoms, subpathKey)
	return edge === null ? (
		<rect
			key={subpathKey}
			x={x - 5}
			y={y - 5}
			width={10}
			height={10}
			fill="white"
			stroke="red"
			onPointerDown={(evt) => {
				evt.currentTarget.setPointerCapture(evt.pointerId)
				setState(dragRefAtom, { key: subpathKey })
			}}
		/>
	) : (
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
				fill="none"
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
	fetch("/public/preact.svg")
		.then((res) => res.text())
		.then((text) => {
			const [a] = text
				.split("\n")
				.filter((l) => l.startsWith("\t<path"))
				.map((l) => l.split(`d="`)[1].slice(0, -9))

			const CODES = [`m`, `M`, `l`, `L`, `c`, `C`, `v`, `V`, `z`, `Z`] as const
			type Letter = Exclude<(typeof CODES)[number], `z` | `Z`>
			let letter: Letter | undefined
			let number = ``
			let numbers: number[] = []
			const instructions: { letter: Letter; numbers: number[] }[] = []
			for (let i = 0; i < a.length; i++) {
				const c = a[i]
				if (CODES.includes(c as Letter)) {
					if (number) {
						numbers.push(Number.parseFloat(number))
						number = ``
					}
					if (letter) {
						instructions.push({ letter, numbers })
					}
					letter = c as Letter
					numbers = []
					continue
				}
				if (c === ` `) {
					numbers.push(Number.parseFloat(number))
					number = ``
					continue
				}

				number += c
			}
			console.log(a)

			let prev: PointXY = { x: 0, y: 0 }
			const edgeNodes = instructions.map<{
				edge: null | { c?: PointXY; s: PointXY }
				node: PointXY
			}>(({ letter, numbers }) => {
				let node: PointXY
				let edge: null | { c?: PointXY; s: PointXY }
				switch (letter) {
					case `m`:
					case `M`:
						node = { x: numbers[0], y: numbers[1] }
						edge = null
						break
					case `l`:
						node = { x: prev.x + numbers[0], y: prev.y + numbers[1] }
						edge = null
						break
					case `L`:
						node = { x: numbers[0], y: numbers[1] }
						edge = null
						break
					case `c`:
						node = { x: prev.x + numbers[4], y: prev.y + numbers[5] }
						edge = {
							c: { x: prev.x + numbers[0], y: prev.y + numbers[1] },
							s: { x: prev.x + numbers[2], y: prev.y + numbers[3] },
						}
						break
					case `C`:
						node = { x: numbers[4], y: numbers[5] }
						edge = {
							c: { x: numbers[0], y: numbers[1] },
							s: { x: numbers[2], y: numbers[3] },
						}
						break
					case `v`:
						node = { x: prev.x, y: prev.y + numbers[0] }
						edge = null
						break
					case `V`:
						node = { x: prev.x, y: numbers[0] }
						edge = null
				}
				prev = node
				console.log(
					`letter: ${letter}, numbers: ${JSON.stringify(numbers)}, node: [${node.x},${node.y}], prev: [${prev.x},y:${prev.y}]`,
				)
				return { node, edge }
			})

			console.log(JSON.stringify(edgeNodes, null, 2))

			let i = 0
			for (const { node, edge } of edgeNodes) {
				if (edge) {
					setState(edgeAtoms, `${i}`, edge)
				}
				setState(nodeAtoms, `subpath${i}`, node)
				i++
			}
			setState(
				subpathKeysAtoms,
				"path0",
				Array.from({ length: i }, (_, i) => `subpath${i}`),
			)
			setState(pathKeysAtom, (prev) => [...prev, "path0"])
		})
}

const preact = [
	"m128 0l128 73.9v147.8l-128 73.9L0 221.7V73.9z",
	"M34.865 220.478c17.016 21.78 71.095 5.185 122.15-34.704c51.055-39.888 80.24-88.345 63.224-110.126c-17.017-21.78-71.095-5.184-122.15 34.704c-51.055 39.89-80.24 88.346-63.224 110.126Zm7.27-5.68c-5.644-7.222-3.178-21.402 7.573-39.253c11.322-18.797 30.541-39.548 54.06-57.923c23.52-18.375 48.303-32.004 69.281-38.442c19.922-6.113 34.277-5.075 39.92 2.148c5.644 7.223 3.178 21.403-7.573 39.254c-11.322 18.797-30.541 39.547-54.06 57.923c-23.52 18.375-48.304 32.004-69.281 38.441c-19.922 6.114-34.277 5.076-39.92-2.147Z",
	"M220.239 220.478c17.017-21.78-12.169-70.237-63.224-110.126C105.96 70.464 51.88 53.868 34.865 75.648c-17.017 21.78 12.169 70.238 63.224 110.126c51.055 39.889 105.133 56.485 122.15 34.704Zm-7.27-5.68c-5.643 7.224-19.998 8.262-39.92 2.148c-20.978-6.437-45.761-20.066-69.28-38.441c-23.52-18.376-42.74-39.126-54.06-57.923c-10.752-17.851-13.218-32.03-7.575-39.254c5.644-7.223 19.999-8.261 39.92-2.148c20.978 6.438 45.762 20.067 69.281 38.442c23.52 18.375 42.739 39.126 54.06 57.923c10.752 17.85 13.218 32.03 7.574 39.254Z",
	"M127.552 167.667c10.827 0 19.603-8.777 19.603-19.604c0-10.826-8.776-19.603-19.603-19.603c-10.827 0-19.604 8.777-19.604 19.603c0 10.827 8.777 19.604 19.604 19.604Z",
]
