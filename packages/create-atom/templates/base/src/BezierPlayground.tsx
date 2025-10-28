import { atom, atomFamily, getState, resetState, setState } from "atom.io"
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
const nodeAtoms = atomFamily<PointXY | null, string>({
	key: "nodeAtoms",
	default: null,
})
const edgeAtoms = atomFamily<null | { c?: PointXY; s: PointXY }, string>({
	key: "edgeAtoms",
	default: null,
})

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

function InteractiveNode({ subpathKey }: { subpathKey: string }) {
	const node = useO(nodeAtoms, subpathKey)
	const edge = useO(edgeAtoms, subpathKey)
	return node === null ? null : edge === null ? (
		<rect
			key={subpathKey}
			x={node.x - 5}
			y={node.y - 5}
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
			cx={node.x}
			cy={node.y}
			r={5}
			fill="red"
			onPointerDown={(evt) => {
				evt.currentTarget.setPointerCapture(evt.pointerId)
				setState(dragRefAtom, { key: subpathKey })
			}}
		/>
	)
}

function Subpath({
	subpathKey,
	prev,
	idx,
}: {
	subpathKey: string
	prev: string
	idx: number
}) {
	const node = useO(nodeAtoms, subpathKey)
	const edge = useO(edgeAtoms, subpathKey)
	if (node === null) {
		return "Z"
	}
	if (idx === 0 || prev === null) {
		return `M ${node.x} ${node.y}`
	}
	if (edge === null) {
		return `L ${node.x} ${node.y}`
	}
	if (`c` in edge) {
		return `C ${edge.c.x} ${edge.c.y} ${edge.s.x} ${edge.s.y} ${node.x} ${node.y}`
	}
	return `S ${edge.s.x} ${edge.s.y} ${node.x} ${node.y}`
}

function Path({ pathKey }: { pathKey: string }) {
	const subpathKeys = useO(subpathKeysAtoms, pathKey)
	console.log(`subpathKeys`, pathKey, subpathKeys)

	return (
		<>
			<path
				d={`${subpathKeys.map((spk, idx) => Subpath({ subpathKey: spk, prev: subpathKeys[idx - 1], idx })).join(" ")} Z`}
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
	console.log(`pathKeys`, pathKeys)
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
	fetch("preact.svg")
		.then((res) => res.text())
		.then((text) => {
			for (const pathKey of getState(pathKeysAtom)) {
				resetState(subpathKeysAtoms, pathKey)
			}
			resetState(pathKeysAtom)

			const shapes = text
				.split("\n")
				.filter((l) => l.startsWith("\t<path"))
				.map((path) => {
					const raw = path.split(`d="`)[1].slice(0, -9)
					const CODES = [
						`m`,
						`M`,
						`l`,
						`L`,
						`c`,
						`C`,
						`v`,
						`V`,
						`z`,
						`Z`,
					] as const
					type Letter = (typeof CODES)[number]
					let letter: Letter | undefined
					let number = ``
					let numbers: number[] = []

					const instructions: { letter: Letter; numbers: number[] }[] = []
					for (let i = 0; i < raw.length; i++) {
						const c = raw[i]
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
						if (c === `-` && number) {
							numbers.push(Number.parseFloat(number))
							number = `-`
							continue
						}

						number += c
					}
					console.log(raw)
					console.log("👺", JSON.stringify(instructions, null, 2))
					// throw new Error("stop")
					let prev: PointXY = { x: 0, y: 0 }
					const edgeNodes = instructions.map<{
						node: null | PointXY
						edge: null | { c?: PointXY; s: PointXY }
					}>(({ letter, numbers }) => {
						let node: null | PointXY
						let edge: null | { c?: PointXY; s: PointXY }
						switch (letter) {
							case `m`:
								node = { x: prev.x + numbers[0], y: prev.y + numbers[1] }
								edge = null
								break
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
								break
							case `z`:
							case `Z`:
								node = null
								edge = null
						}
						if (node) {
							prev = node
						}
						// console.log(
						// 	`letter: ${letter}, numbers: ${JSON.stringify(numbers)}, node: [${node.x},${node.y}], c:[${edge?.c?.x},${edge?.c?.y}], s:[${edge?.s?.x},${edge?.s?.y}], prev: [${prev.x},y:${prev.y}]`,
						// )
						return { node, edge }
					})

					console.log(JSON.stringify(edgeNodes, null, 2))
					return edgeNodes
				})
			// throw new Error("stop")

			let i = 0
			let j = 0
			for (const shape of shapes) {
				const jj = j
				for (const { node, edge } of shape) {
					if (edge) {
						setState(edgeAtoms, `subpath${j}`, edge)
					}
					setState(nodeAtoms, `subpath${j}`, node)
					j++
				}
				const numberOfNodes = j - jj
				setState(
					subpathKeysAtoms,
					`path${i}`,
					Array.from(
						{ length: numberOfNodes },
						(_, nodeNum) => `subpath${jj + nodeNum}`,
					),
				)
				setState(pathKeysAtom, (prev) => [...prev, `path${i}`])
				i++
			}
		})
}
