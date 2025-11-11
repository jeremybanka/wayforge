import type { ReactNode, Ref } from "react"
import * as THREE from "three"

export type CubeTokenStackProps = {
	position: THREE.Vector3
	count: number
}
export function CubeTokenStack({
	position,
	count,
}: CubeTokenStackProps): ReactNode {
	const radius = count * 0.1 + 0.1
	return (
		<group position={position}>
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
