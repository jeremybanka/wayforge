import type { ReactNode, Ref } from "react"
import * as THREE from "three"

export type CubeTokenStackProps = {
	position: THREE.Vector3
	count: number
}
export function CubeTokenStack({
	position: [x, y, z],
	count,
}: CubeTokenStackProps): ReactNode {
	const layers: (1 | 2 | 3 | 4)[] = []
	while (count > 0) {
		if (count >= 4) {
			layers.push(4)
			count -= 4
		} else {
			layers.push(count as 1 | 2 | 3)
			count = 0
		}
	}

	return (
		<>
			{layers.map((layerCount, i) => (
				<CubeTokenLayer
					key={i}
					position={new THREE.Vector3(x, y + i * 0.5, z)}
					count={layerCount}
					rotation={new THREE.Euler(0, (i * Math.PI) / 3, 0)}
				/>
			))}
		</>
	)
}
export type CubeTokenLayerProps = {
	position: THREE.Vector3
	rotation: THREE.Euler
	count: 1 | 2 | 3 | 4
}
export function CubeTokenLayer({
	position,
	rotation: rOffset,
	count,
}: CubeTokenLayerProps): ReactNode {
	const radius = count * 0.1 + 0.1
	return (
		<group position={position} rotation={rOffset}>
			{count === 1 ? (
				<CubeToken
					color={`#f00`}
					position={new THREE.Vector3(0, 0, 0)}
					rotation={new THREE.Euler(0, 0, 0)}
					onPointerDown={(pos) => {
						console.log(`onPointerDown`, pos)
					}}
					onPointerUp={(pos) => {
						console.log(`onPointerUp`, pos)
					}}
				/>
			) : (
				Array.from({ length: count }).map((_, i) => {
					const angle = (i / count) * Math.PI * 2
					const x = Math.cos(angle) * radius
					const z = Math.sin(angle) * radius
					// const rotation = new THREE.Euler(0, angle, 0)

					console.log(`angle`, angle)

					const rotation = new THREE.Euler(0, (Math.PI * 3) / 2 - angle, 0)

					// const dir = new THREE.Vector3(0, 0, 2).applyEuler(rotation)

					const color = i === 0 ? `#f00` : i === 1 ? `#0f0` : `#00f`

					return (
						<CubeToken
							key={i}
							color={color}
							position={new THREE.Vector3(x, 0, z)}
							rotation={rotation}
							onPointerDown={(pos) => {
								console.log(`onPointerDown`, pos)
							}}
							onPointerUp={(pos) => {
								console.log(`onPointerUp`, pos)
							}}
						/>
					)
				})
			)}
		</group>
	)
}

export type CubeTokenProps = {
	ref?: Ref<THREE.Mesh>
	color?: THREE.ColorRepresentation
	position?: THREE.Vector3
	rotation?: THREE.Euler
	onPointerDown?: (position: THREE.Vector3) => void
	onPointerUp?: (position: THREE.Vector3) => void
}
export function CubeToken(props: CubeTokenProps): ReactNode {
	return (
		<mesh {...props} receiveShadow>
			<boxGeometry args={[0.5, 0.5, 0.5]} />
			<meshStandardMaterial color={props.color ?? `hotpink`} />
		</mesh>
	)
}
