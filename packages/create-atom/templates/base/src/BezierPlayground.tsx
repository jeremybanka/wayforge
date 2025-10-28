import { atom, atomFamily, getState, resetState, setState } from "atom.io"
import { type RegularAtomToken } from "atom.io"
import { useO } from "atom.io/react"
import { fstat } from "fs"
import { PointerEvent, PointerEventHandler } from "preact/compat"
import { useRef, useCallback, useEffect, MutableRef } from "preact/hooks"

const WIDTH = 256
const HEIGHT = 296

type PointXY = { x: number; y: number }
type EdgeXY = { c?: PointXY; s: PointXY }

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
const edgeAtoms = atomFamily<boolean | EdgeXY, string>({
	key: "edgeAtoms",
	default: true,
})

export function useAtomicRef<T>(
	token: RegularAtomToken<T | null>,
): MutableRef<T | null> {
	const ref = useRef<T | null>(null)
	useEffect(() => {
		setState(token, ref.current)
	}, [token])
	return ref
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

function InteractiveNode({ subpathKey }: { subpathKey: string }) {
	const node = useO(nodeAtoms, subpathKey)
	const edge = useO(edgeAtoms, subpathKey)
	return node === null ? null : typeof edge === "boolean" ? (
		<rect
			key={subpathKey}
			class="node"
			x={node.x - 5}
			y={node.y - 5}
			width={10}
			height={10}
			onPointerDown={(evt) => {
				evt.currentTarget.setPointerCapture(evt.pointerId)
				setState(dragRefAtom, { key: subpathKey })
			}}
		/>
	) : (
		<circle
			key={subpathKey}
			class="node"
			cx={node.x}
			cy={node.y}
			r={5}
			onPointerDown={(evt) => {
				evt.currentTarget.setPointerCapture(evt.pointerId)
				setState(dragRefAtom, { key: subpathKey })
			}}
		/>
	)
}

function Subpath({ subpathKey, idx }: { subpathKey: string; idx: number }) {
	const node = useO(nodeAtoms, subpathKey)
	const edge = useO(edgeAtoms, subpathKey)

	if (node === null) {
		return "Z"
	}
	if (idx === 0) {
		return `M ${node.x} ${node.y}`
	}
	if (edge === false) {
		return `M ${node.x} ${node.y}`
	}
	if (edge === true) {
		return `L ${node.x} ${node.y}`
	}
	if (`c` in edge) {
		return `C ${edge.c.x} ${edge.c.y} ${edge.s.x} ${edge.s.y} ${node.x} ${node.y}`
	}
	return `S ${edge.s.x} ${edge.s.y} ${node.x} ${node.y}`
}

function Path({ pathKey }: { pathKey: string }) {
	const subpathKeys = useO(subpathKeysAtoms, pathKey)
	return (
		<>
			<path
				d={`${subpathKeys.map((spk, idx) => Subpath({ subpathKey: spk, idx })).join(" ")} Z`}
				class="path"
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

const CODES = [`m`, `M`, `l`, `L`, `c`, `C`, `v`, `V`, `z`, `Z`] as const

function reset() {
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

					let prev: PointXY = { x: 0, y: 0 }
					const edgeNodes = instructions.map<{
						node: null | PointXY
						edge: boolean | { c?: PointXY; s: PointXY }
					}>(({ letter, numbers }) => {
						let node: null | PointXY
						let edge: boolean | { c?: PointXY; s: PointXY }
						switch (letter) {
							case `m`:
								console.log(`m`, { prev, numbers })
								node = { x: prev.x + numbers[0], y: prev.y + numbers[1] }
								edge = false
								break
							case `M`:
								node = { x: numbers[0], y: numbers[1] }
								edge = false
								break
							case `l`:
								node = { x: prev.x + numbers[0], y: prev.y + numbers[1] }
								edge = true
								break
							case `L`:
								node = { x: numbers[0], y: numbers[1] }
								edge = true
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
								edge = true
								break
							case `V`:
								node = { x: prev.x, y: numbers[0] }
								edge = true
								break
							case `z`:
							case `Z`:
								node = null
								edge = true
						}
						if (node) {
							prev = node
						}

						return { node, edge }
					})

					return edgeNodes
				})

			let i = 0
			let j = 0
			for (const shape of shapes) {
				const jj = j
				for (const { node, edge } of shape) {
					setState(edgeAtoms, `subpath${j}`, edge)
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
				viewBox={`-10 -10 ${WIDTH + 20} ${HEIGHT + 20}`}
				width={1000}
				height={500}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
			>
				<title>Bezier Playground</title>
				<defs>
					<pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
						<circle cx="0" cy="0" r="0.25" fill="none" stroke="#aaa" />
					</pattern>
				</defs>
				<rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#7771" />
				<rect x={-1000} y={-1000} width={2000} height={2000} fill="url(#grid)" />
				<PathsDemo />
			</svg>
			<button type="button" class="flat" onClick={reset}>
				Reset
			</button>
		</div>
	)
}
