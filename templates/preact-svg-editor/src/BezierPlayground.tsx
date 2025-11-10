import type { Loadable } from "atom.io"
import {
	atom,
	atomFamily,
	getState,
	resetState,
	runTransaction,
	selectorFamily,
	setState,
	transaction,
} from "atom.io"
import { useO, useAtomicRef } from "atom.io/react"
import type { PointerEventHandler, TargetedPointerEvent, VNode } from "preact"
import { useCallback, useEffect, useRef } from "preact/hooks"

type PointXY = { x: number; y: number }
type EdgeXY = { c?: PointXY; s: PointXY }

const pathKeysAtom = atom<string[]>({
	key: `pathKeys`,
	default: [],
})
const subpathKeysAtoms = atomFamily<string[], string>({
	key: `subpathKeys`,
	default: [],
})
const nodeAtoms = atomFamily<PointXY | null, string>({
	key: `nodeAtoms`,
	default: null,
})
const edgeAtoms = atomFamily<EdgeXY | boolean, string>({
	key: `edgeAtoms`,
	default: true,
})
const pathDrawSelectors = selectorFamily<string, string>({
	key: `pathDrawSelectors`,
	get:
		(pathKey) =>
		({ get }) => {
			const subpathKeys = get(subpathKeysAtoms, pathKey)
			return subpathKeys
				.map((subpathKey, idx) => {
					const node = get(nodeAtoms, subpathKey)
					const edge = get(edgeAtoms, subpathKey)

					if (node === null) {
						return `Z`
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
				})
				.join(` `)
		},
})

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

function Bezier({
	at,
	subpathKey,
	prevSubpathKey,
	node: maybeNode,
}: {
	at: PointXY
	subpathKey: string
	prevSubpathKey: string
	node?: PointXY
}) {
	let node: PointXY | null
	// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
	switch (typeof maybeNode) {
		case `undefined`:
			// eslint-disable-next-line react-hooks/rules-of-hooks
			node = useO(nodeAtoms, prevSubpathKey)
			break
		default:
			node = maybeNode
	}
	return node === null ? null : (
		<>
			<line
				class="bezier"
				x1={node.x}
				y1={node.y}
				x2={at.x}
				y2={at.y}
				stroke="#777"
				stroke-width={1}
			/>
			<circle
				class="bezier"
				fill="#777"
				stroke="#aaa"
				stroke-width={1}
				cx={at.x}
				cy={at.y}
				r={2}
			/>
			<circle
				class="bezier-draggable"
				fill="transparent"
				cx={at.x}
				cy={at.y}
				r={6}
				onPointerDown={(evt) => {
					evt.currentTarget.setPointerCapture(evt.pointerId)
					setState(currentlyDraggingAtom, {
						key: subpathKey,
						by: !maybeNode ? `c` : `s`,
					})
				}}
			/>
		</>
	)
}

function Node({
	subpathKey,
	nextSubpathKey,
}: {
	subpathKey: string
	nextSubpathKey: string
}) {
	const node = useO(nodeAtoms, subpathKey)
	const edge = useO(edgeAtoms, subpathKey)
	return node === null ? null : (
		<>
			{typeof edge === `boolean` ? (
				<rect class="node" x={node.x - 3} y={node.y - 3} width={6} height={6} />
			) : (
				<>
					<Bezier
						at={edge.s}
						node={node}
						subpathKey={subpathKey}
						prevSubpathKey={nextSubpathKey}
					/>
					{edge.c ? (
						<Bezier
							at={edge.c}
							subpathKey={subpathKey}
							prevSubpathKey={nextSubpathKey}
						/>
					) : null}
					<circle class="node" cx={node.x} cy={node.y} r={3} />
				</>
			)}
			<circle
				class="node-draggable"
				fill="transparent"
				cx={node.x}
				cy={node.y}
				r={10}
				onPointerDown={(evt) => {
					evt.currentTarget.setPointerCapture(evt.pointerId)
					setState(currentlyDraggingAtom, { key: subpathKey })
				}}
			/>
		</>
	)
}

function RenderedPath({ pathKey }: { pathKey: string }) {
	const draw = useO(pathDrawSelectors, pathKey)
	return <path d={`${draw} Z`} class="path" style={{ pointerEvents: `none` }} />
}

function Path({ pathKey }: { pathKey: string }) {
	const subpathKeys = useO(subpathKeysAtoms, pathKey)
	return (
		<>
			<RenderedPath pathKey={pathKey} />
			{subpathKeys.toReversed().map((spk, idx, arr) => (
				<Node
					subpathKey={spk}
					nextSubpathKey={arr[idx + 1] ?? arr[0]}
					key={spk}
				/>
			))}
		</>
	)
}

function PathsDemo() {
	const pathKeys = useO(pathKeysAtom)
	return (
		<>
			{pathKeys.map((pathKey) => {
				return <Path pathKey={pathKey} key={pathKey} />
			})}
		</>
	)
}

const svgRefAtom = atom<SVGSVGElement | null>({
	key: `svgRef`,
	default: null,
})
const currentlyDraggingAtom = atom<{ key: string; by?: `c` | `s` } | null>({
	key: `currentlyDragging`,
	default: null,
})

function onPointerMove(evt: TargetedPointerEvent<SVGSVGElement>): void {
	evt.preventDefault()
	const { key: currentlyDragging, by: draggingBy } =
		getState(currentlyDraggingAtom) ?? {}
	const svg = getState(svgRefAtom)
	if (!svg || !currentlyDragging) {
		return
	}
	const pt = svg.createSVGPoint()
	pt.x = evt.clientX
	pt.y = evt.clientY
	const ctm = svg.getScreenCTM()?.inverse()
	const { x, y } = pt.matrixTransform(ctm)

	switch (draggingBy) {
		case undefined:
			setState(nodeAtoms, currentlyDragging, {
				x: clamp(x, -185, WIDTH + 185),
				y: clamp(y, -10, HEIGHT + 10),
			})
			break
		case `s`:
			setState(edgeAtoms, currentlyDragging, (prev) => ({
				...(prev as EdgeXY),
				s: { x: clamp(x, -185, WIDTH + 185), y: clamp(y, -10, HEIGHT + 10) },
			}))
			break
		case `c`:
			setState(edgeAtoms, currentlyDragging, (prev) => ({
				...(prev as EdgeXY),
				c: { x: clamp(x, -185, WIDTH + 185), y: clamp(y, -10, HEIGHT + 10) },
			}))
			break
	}
}

const CODES = [`m`, `M`, `l`, `L`, `c`, `C`, `v`, `V`, `z`, `Z`] as const

const preactLogoAtom = atom<Loadable<string>>({
	key: `preactLogo`,
	default: () => fetch(`preact.svg`).then((res) => res.text()),
})

const resetTX = transaction<() => Promise<void>>({
	key: `reset`,
	do: async () => {
		const logo = await getState(preactLogoAtom)
		for (const pathKey of getState(pathKeysAtom)) {
			resetState(subpathKeysAtoms, pathKey)
		}
		resetState(pathKeysAtom)

		const shapes = logo
			.split(`\n`)
			.filter((line) => line.startsWith(`\t<path`))
			.map((line) => {
				const raw = line.split(`d="`)[1].slice(0, -9)

				type Letter = (typeof CODES)[number]
				let letter: Letter | undefined
				let number = ``
				let numbers: number[] = []

				const instructions: { letter: Letter; numbers: number[] }[] = []
				for (const c of raw) {
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
					node: PointXY | null
					edge: boolean | { c?: PointXY; s: PointXY }
				}>(({ letter: l, numbers: ns }) => {
					let node: PointXY | null
					let edge: boolean | { c?: PointXY; s: PointXY }
					switch (l) {
						case `m`:
							node = { x: prev.x + ns[0], y: prev.y + ns[1] }
							edge = false
							break
						case `M`:
							node = { x: ns[0], y: ns[1] }
							edge = false
							break
						case `l`:
							node = { x: prev.x + ns[0], y: prev.y + ns[1] }
							edge = true
							break
						case `L`:
							node = { x: ns[0], y: ns[1] }
							edge = true
							break
						case `c`:
							node = { x: prev.x + ns[4], y: prev.y + ns[5] }
							edge = {
								c: { x: prev.x + ns[0], y: prev.y + ns[1] },
								s: { x: prev.x + ns[2], y: prev.y + ns[3] },
							}
							break
						case `C`:
							node = { x: ns[4], y: ns[5] }
							edge = {
								c: { x: ns[0], y: ns[1] },
								s: { x: ns[2], y: ns[3] },
							}
							break
						case `v`:
							node = { x: prev.x, y: prev.y + ns[0] }
							edge = true
							break
						case `V`:
							node = { x: prev.x, y: ns[0] }
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
	},
})
const reset = runTransaction(resetTX)

const WIDTH = 256
const HEIGHT = 296
export default function BezierPlayground(): VNode {
	const svgRef = useAtomicRef(svgRefAtom, useRef)
	const onPointerUp: PointerEventHandler<SVGSVGElement> = useCallback((evt) => {
		evt.currentTarget.releasePointerCapture(evt.pointerId)
		setState(currentlyDraggingAtom, null)
	}, [])

	useEffect(() => void reset(), [])

	return (
		<div
			style={{
				display: `flex`,
				flexFlow: `column`,
				position: `relative`,
				overflow: `hidden`,
				maxWidth: `1280px`,
				width: `100vw`,
				alignItems: `center`,
			}}
		>
			<svg
				ref={svgRef}
				viewBox={`-185 -15 ${WIDTH + 370} ${HEIGHT + 30}`}
				width={1000}
				height={500}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
			>
				<title>Bezier Playground</title>
				<defs>
					<pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
						<rect x="0" y="0" width=".5" height=".5" fill="none" stroke="#aaa" />
					</pattern>
				</defs>
				<rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#aaa3" />
				<rect
					x={-185}
					y={-10}
					width={WIDTH + 370}
					height={HEIGHT + 20}
					fill="url(#grid)"
				/>
				<PathsDemo />
			</svg>
			<button type="button" class="flat" onClick={reset}>
				Reset
			</button>
		</div>
	)
}
